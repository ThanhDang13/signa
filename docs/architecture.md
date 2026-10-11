# Architecture Deep Dive

This document provides a detailed explanation of Signa's architecture, design decisions, and implementation patterns.

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Clean Architecture & DDD](#clean-architecture--ddd)
3. [CQRS Implementation](#cqrs-implementation)
4. [HTTP Contract System](#http-contract-system)
5. [Policy-Based Authorization](#policy-based-authorization)
6. [Event-Driven Processing](#event-driven-processing)
7. [Computer Vision Pipeline](#computer-vision-pipeline)
8. [Data Flow Examples](#data-flow-examples)

---

## System Overview

Signa is built as a distributed system with clear separation of concerns:

```
┌─────────────┐     ┌─────────────┐
│  Web Client │     │Android App  │
│  (React)    │     │(React Native)│
└──────┬──────┘     └──────┬──────┘
       │                   │
       │  HTTP Contracts   │
       └────────┬──────────┘
                │
        ┌───────▼────────┐
        │   API Server   │
        │   (NestJS)     │◄────┐
        └───────┬────────┘     │
                │               │
         ┌──────▼──────┐       │
         │   BullMQ    │       │
         │   + Redis   │       │
         └──────┬──────┘       │
                │               │
        ┌───────▼────────┐     │
        │ Worker Service │─────┘
        │   (NestJS)     │   Result
        │  + OpenCV      │   Events
        └───────┬────────┘
                │
         ┌──────▼──────┐
         │  S3 Storage │
         │ PDFs/Images │
         └─────────────┘
```

### Key Design Decisions

1. **Separation of API and Worker**: CPU-intensive tasks (PDF generation, image processing) run in a dedicated worker service to keep API responsive
2. **Event-driven communication**: API and Worker communicate via BullMQ with typed job contracts
3. **S3 for artifacts**: Large files (PDFs, images) stored in S3, not database
4. **Type-safe contracts**: All HTTP endpoints and queue jobs defined with Zod schemas for compile-time and runtime safety

---

## Clean Architecture & DDD

Each business module (Identity, Election, Ballot) follows Clean Architecture principles with four layers:

```
┌─────────────────────────────────────────────────┐
│              Presentation Layer                  │
│  Controllers, DTOs, Route Decorators            │
└────────────────┬────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────┐
│             Application Layer                    │
│  Commands, Queries, Handlers, Services          │
│  (Orchestrates domain, no business logic)       │
└────────────────┬────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────┐
│              Domain Layer                        │
│  Entities, Value Objects, Business Logic        │
│  (Framework-agnostic, pure TypeScript)          │
└────────────────┬────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────┐
│           Infrastructure Layer                   │
│  Repository Implementations, Adapters            │
│  (Drizzle, S3, External APIs)                   │
└─────────────────────────────────────────────────┘
```

### Domain Layer

**Entities** - Aggregates with business logic:

```typescript
export class Election extends BaseEntity {
  @Accessor({ readonly: true })
  public readonly id!: ElectionId;

  @Accessor({ touchOnSet: true })
  public title!: string;

  @Accessor({ touchOnSet: true })
  public status!: ElectionStatus;

  // Business logic methods
  public activate(): void {
    if (this.status !== ELECTION_STATUSES.DRAFT) {
      throw createInvalidElectionStatusError(this.status, 'activate');
    }
    this.status = ELECTION_STATUSES.ACTIVE;
  }

  public close(): void {
    if (this.status !== ELECTION_STATUSES.ACTIVE) {
      throw createInvalidElectionStatusError(this.status, 'close');
    }
    this.status = ELECTION_STATUSES.CLOSED;
  }
}
```

**Value Objects** - Immutable identifiers:

```typescript
export class ElectionId extends ValueObject<string> {
  private constructor(value: string) {
    super(value);
  }

  static create(): ElectionId {
    return new ElectionId(uuidv7());
  }

  static from(value: string): ElectionId {
    if (!validate(value)) {
      throw new Error('Invalid ElectionId format');
    }
    return new ElectionId(value);
  }

  toString(): string {
    return this.value;
  }
}
```

**Repository Ports** - Interfaces in domain, implementations in infrastructure:

```typescript
// Domain port (interface)
export interface BallotRepository {
  findById(id: string): Promise<Ballot | null>;
  save(ballot: Ballot): Promise<void>;
  findByElectionId(electionId: string): Promise<Ballot[]>;
}

// Infrastructure implementation
@Injectable()
export class DrizzleBallotRepository implements BallotRepository {
  async findById(id: string): Promise<Ballot | null> {
    const row = await this.db.query.ballots.findFirst({
      where: eq(ballots.id, id)
    });
    return row ? Ballot.rehydrate(row) : null;
  }

  async save(ballot: Ballot): Promise<void> {
    if (ballot.isNew) {
      await this.db.insert(ballots).values(ballot.toPrimitives());
    } else if (ballot.isDirty) {
      await this.db.update(ballots)
        .set(ballot.toPrimitives())
        .where(eq(ballots.id, ballot.id));
    }
  }
}
```

---

## CQRS Implementation

Commands modify state through domain entities (write model), while queries read directly from the database (read model).

### Command Flow

```
Controller → Command → CommandHandler → Domain Entity → Repository → Database
```

**Example: Update Election**

```typescript
// 1. Controller receives request
@ContractRoute(updateElectionContract)
@Protected()
@Policy(isAdmin)
async update(@Param() params, @Body() body) {
  return this.commandBus.execute(
    new UpdateElectionCommand({ id: params.id, ...body })
  );
}

// 2. Command handler loads entity
@CommandHandler(UpdateElectionCommand)
export class UpdateElectionHandler {
  async execute(command: UpdateElectionCommand) {
    const election = await this.repo.findById(command.payload.id);
    if (!election) throw createElectionNotFoundError();
    
    // 3. Business logic in entity
    election.updateDetails({
      title: command.payload.title,
      formStructure: command.payload.formStructure
    });
    
    // 4. Save (only if entity.isDirty)
    await this.repo.save(election);
    
    return { message: 'Election updated' };
  }
}
```

### Query Flow

```
Controller → Query → QueryHandler → Query Builder → Database
```

**Example: List Elections**

```typescript
// 1. Controller receives request
@ContractRoute(listElectionsContract)
@Protected()
async list(@Query() query) {
  return this.queryBus.execute(new ListElectionsQuery(query));
}

// 2. Query handler uses query builder directly (no entities)
@QueryHandler(ListElectionsQuery)
export class ListElectionsHandler {
  async execute(query: ListElectionsQuery) {
    const { pageIndex, pageSize, status, sortBy, order } = query.payload;
    
    // Direct database query for read model
    const [data, total] = await Promise.all([
      this.db.query.elections.findMany({
        where: status ? eq(elections.status, status) : undefined,
        orderBy: order === 'asc' 
          ? asc(elections[sortBy]) 
          : desc(elections[sortBy]),
        limit: pageSize,
        offset: pageIndex * pageSize
      }),
      this.db.select({ count: count() })
        .from(elections)
        .where(status ? eq(elections.status, status) : undefined)
    ]);
    
    return {
      data,
      meta: {
        pageIndex,
        pageSize,
        totalPages: Math.ceil(total[0].count / pageSize),
        totalItems: total[0].count
      }
    };
  }
}
```

### Why This Approach?

- **Commands**: Need business logic validation, state transitions, invariants → Domain entities required
- **Queries**: Need speed, pagination, filtering, sorting → Direct SQL via query builder is faster
- **Pragmatic CQRS**: Full event sourcing would be overkill; this balances safety and performance

---

## HTTP Contract System

Type-safe HTTP endpoints using custom DSL that generates types and validates at compile-time and runtime.

### Contract Definition

```typescript
export const createElectionContract = defineContract({
  method: "POST",
  path: "/elections",
  body: z.object({
    title: z.string().min(1).max(200),
    description: z.string().optional(),
    formStructure: formStructureSchema,
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional()
  }),
  response: electionReadModelSchema
});

// Automatic type inference
type CreateElectionBody = z.infer<typeof createElectionContract.body>;
type CreateElectionResponse = z.infer<typeof createElectionContract.response>;
```

### Controller Usage

```typescript
@ContractRoute(createElectionContract)
@Protected()
@Policy(isAdmin)
@Response({ type: CreateElectionOutputDto })
async create(
  @Body() dto: CreateElectionInputDto,
  @CurrentUser() user: JwtPayload
) {
  return this.commandBus.execute(
    new CreateElectionCommand({
      ...dto,
      createdById: user.id
    })
  );
}
```

### Client Usage (Type-Safe)

```typescript
// Web client
import { createElectionContract } from '@signa/contracts-http/election';
import { createClient } from '@signa/dsl-http-client';

const client = createClient({ baseUrl: API_URL });

// Fully typed request and response
const election = await client.execute(createElectionContract, {
  body: {
    title: 'General Election 2024',
    formStructure: { /* ... */ }
  }
});
// election is typed as ElectionReadModel
```

### Benefits

1. **Single source of truth**: Contract defines request/response schemas
2. **Compile-time safety**: TypeScript catches mismatches
3. **Runtime validation**: Zod validates incoming data
4. **Auto-generated DTOs**: `createZodDto` generates NestJS DTOs from schemas
5. **Path parameter validation**: Enforces params match path at compile time

---

## Policy-Based Authorization

Composable authorization policies using a custom DSL.

### Policy Definition

```typescript
// packages/runtime/policy/src/rbac/evaluators.ts
export function hasRole(...roles: Role[]): PolicyEvaluator {
  return (input) => {
    if (!input.subject.roles) {
      return deny('Subject has no roles');
    }
    
    const hasAny = roles.some(role => input.subject.roles.includes(role));
    return hasAny 
      ? allow() 
      : deny(`Subject missing required roles: ${roles.join(', ')}`);
  };
}

// apps/api/src/core/policy/admin.policy.ts
export const isAdmin = policy({
  name: 'admin.access',
  evaluate: hasRole(ROLES.SUPER_ADMIN),
  resolveSubject: [RoleSubjectResolver]
});
```

### Boolean Composition

```typescript
import { and, or, not } from '@signa/dsl-policy';

// Complex policies
const canEditResource = policy({
  name: 'resource.edit',
  evaluate: or(
    hasRole(ROLES.SUPER_ADMIN),
    and(
      hasPermission('resource.write'),
      isOwner
    )
  )
});
```

### Usage in Controllers

```typescript
@ContractRoute(updateElectionContract)
@Protected() // JWT authentication
@Policy(isAdmin) // Authorization
async update(@Param() params, @Body() body) {
  // Only SUPER_ADMIN can reach here
}

@ContractRoute(updateBallotContract)
@Protected()
@Policy(or(isAdmin, isOwner))
async updateBallot(
  @Param() params, 
  @Body() body,
  @Resource() ballot // Injected resource for policy evaluation
) {
  // SUPER_ADMIN or resource owner can reach here
}
```

### Subject Resolvers

```typescript
@Injectable()
export class RoleSubjectResolver implements PolicySubjectResolver {
  async resolve(req: Request): Promise<PolicySubject> {
    const user = req.user; // From JWT
    
    return {
      id: user.id,
      roles: await this.getUserRoles(user.id),
      permissions: await this.getUserPermissions(user.id)
    };
  }
}
```

---

## Event-Driven Processing

Asynchronous job processing with BullMQ and typed contracts.

### Job Contract Definition

```typescript
// packages/contracts/queue/src/ballot/generate-ballot.job.ts
export const generateBallotJob = defineJob({
  queue: 'ballot',
  job: 'generate',
  data: z.object({
    batchId: z.string(),
    electionId: z.string(),
    ballots: z.array(z.object({
      ballotId: z.string(),
      qrData: z.string()
    }))
  }),
  result: z.object({
    batchId: z.string(),
    pdfKey: z.string(),
    ballotsGenerated: z.number()
  })
});
```

### Publishing Jobs (API)

```typescript
@Injectable()
export class GenerateBallotsHandler {
  constructor(private readonly queue: QueuePublisher) {}

  async execute(command: GenerateBallotsCommand) {
    const jobId = uuidv7();
    
    await this.queue.publish(generateBallotJob, {
      batchId: jobId,
      electionId: command.payload.electionId,
      ballots: [/* ... */]
    }, {
      jobId,
      attempts: 3
    });
    
    return { message: 'Job queued', jobId };
  }
}
```

### Processing Jobs (Worker)

```typescript
@Injectable()
export class BallotGenerationProcessor extends ContractWorker {
  @JobHandler(generateBallotJob)
  async handleGenerateBallot(job: Job<InferJobData<typeof generateBallotJob>>) {
    const { batchId, electionId, ballots } = job.data;
    
    // Generate PDF
    const { pdfBuffer } = await this.pdfService.generateBatch(
      formStructure,
      ballots
    );
    
    // Upload to S3
    const pdfKey = await this.pdfRepo.upload(electionId, batchId, pdfBuffer);
    
    // Return result (automatically emitted to results queue)
    return {
      batchId,
      pdfKey,
      ballotsGenerated: ballots.length
    };
  }
}
```

### Consuming Results (API)

```typescript
@Injectable()
export class BallotGenerationResultHandler {
  @OnJobResult(generateBallotJob)
  async handleResult(result: JobResult<InferJobResult<typeof generateBallotJob>>) {
    if (!result.success) {
      // Handle failure
      await this.markBatchAsFailed(result.requestId, result.error);
      return;
    }
    
    // Update batch status
    await this.db.update(batches)
      .set({
        status: 'completed',
        pdfKey: result.data.pdfKey
      })
      .where(eq(batches.id, result.data.batchId));
  }
}
```

### Flow Diagram

```
┌─────────┐     publish     ┌─────────┐
│   API   │────────────────>│  BullMQ │
└─────────┘                 └────┬────┘
                                 │ consume
                            ┌────▼────┐
                            │ Worker  │
                            └────┬────┘
                                 │ emit result
                            ┌────▼────────┐
                            │BullMQ Results│
                            └────┬────────┘
                                 │ consume
┌─────────┐                 ┌────▼────┐
│   API   │<────────────────│  Result │
│ Handler │     notify      │ Consumer│
└─────────┘                 └─────────┘
```

---

## Computer Vision Pipeline

Multi-stage processing for robust ballot scanning under real-world conditions.

### Stage 1: ArUco Marker Detection

```typescript
// 4 ArUco markers embedded in PDF corners (IDs 0-3)
const markerPositions = [
  { id: 0, x: 20, y: 20 },           // Top-left
  { id: 1, x: 575, y: 20 },          // Top-right
  { id: 2, x: 20, y: 822 },          // Bottom-left
  { id: 3, x: 575, y: 822 }          // Bottom-right
];

// Detection
const detector = new cv.ArucoDetector(dictionary);
const { corners, ids } = detector.detectMarkers(grayImage);

if (ids.length !== 4) {
  throw new Error('Expected 4 ArUco markers, found ' + ids.length);
}
```

### Stage 2: Perspective Correction

```typescript
// Calculate homography from detected markers to expected positions
const srcPoints = cv.matFromArray(4, 1, cv.CV_32FC2, [
  corners[0][0].x, corners[0][0].y,  // Detected top-left
  corners[1][0].x, corners[1][0].y,  // Detected top-right
  corners[2][0].x, corners[2][0].y,  // Detected bottom-left
  corners[3][0].x, corners[3][0].y   // Detected bottom-right
]);

const dstPoints = cv.matFromArray(4, 1, cv.CV_32FC2, [
  20, 20,      // Expected top-left
  575, 20,     // Expected top-right
  20, 822,     // Expected bottom-left
  575, 822     // Expected bottom-right
]);

const transform = cv.getPerspectiveTransform(srcPoints, dstPoints);
cv.warpPerspective(image, alignedImage, transform, outputSize);
```

### Stage 3: QR Code Verification

```typescript
// QR contains: ballotId + HMAC signature
const qrData = decodeQR(alignedImage);
const [ballotId, signature] = qrData.split('|');

// HMAC verification (ballot ID signed with secret key)
const expectedSignature = createHmac('sha256', SECRET_KEY)
  .update(ballotId)
  .digest('hex');

if (signature !== expectedSignature) {
  throw new Error('QR signature verification failed - ballot may be tampered');
}
```

### Stage 4: OMR Detection

```typescript
// For each checkbox/radio button field
for (const field of layout.fields) {
  for (const option of field.options) {
    const { x, y, width, height } = option.omr; // Coordinates in mm
    
    // Extract ROI (Region of Interest)
    const roi = extractROI(alignedImage, x, y, width, height);
    
    // Calculate mark score
    const score = calculateMarkScore(roi);
    // score = {
    //   darkCoverage: 0.73,          // % of dark pixels
    //   largestComponent: 0.68,      // % covered by largest connected component
    //   connectedRatio: 0.93,        // dark pixels that are connected
    //   centerCoverage: 0.81,        // darkness in center region
    //   confidence: 0.87             // overall confidence (0-1)
    // }
    
    if (score.confidence > 0.75) {
      selections.push({ fieldId: field.id, value: option.value });
    }
  }
}
```

**Why confidence scoring vs simple threshold?**
- Simple "is it > 50% dark?" fails on pencil marks, shadows, printing variations
- Multi-metric scoring handles: light pencil marks, incomplete fills, stray marks
- Connected component analysis rejects scattered noise
- Center weighting handles edge artifacts

---

## Data Flow Examples

### Example 1: Create Election with Ballot Form

```
1. User submits form via Web UI
   ↓
2. Web → POST /elections { title, formStructure }
   ↓
3. API Controller validates with contract schema
   ↓
4. @Policy(isAdmin) checks user role
   ↓
5. CommandBus.execute(CreateElectionCommand)
   ↓
6. CreateElectionHandler
   ↓
7. Election.create() - domain entity with business logic
   ↓
8. Repository.save(election) - Drizzle insert
   ↓
9. Return { id, status: 'draft' }
```

### Example 2: Generate Ballot Batch

```
1. Admin clicks "Generate 100 Ballots"
   ↓
2. Web → POST /ballots/generate { electionId, count: 100 }
   ↓
3. API: GenerateBallotsCommand
   ↓
4. Handler creates ballot records in DB (status: pending)
   ↓
5. Handler publishes job to BullMQ: generateBallotJob
   ↓
6. Worker picks up job
   ↓
7. Worker: Generate PDF with ArUco markers + QR codes
   ↓
8. Worker: Upload PDF to S3
   ↓
9. Worker: Return result { batchId, pdfKey }
   ↓
10. Result emitted to ballot.results queue
   ↓
11. API ResultConsumer receives result
   ↓
12. Update batch status to 'completed' in DB
```

### Example 3: Scan Ballot

```
1. User scans ballot with Android camera
   ↓
2. Android → POST /ballots/{id}/upload (get presigned URL)
   ↓
3. Android → Upload image directly to S3
   ↓
4. Android → POST /ballots/{id}/process { s3Key }
   ↓
5. API: ProcessBallotScanCommand
   ↓
6. Check: Ballot exists? Election active? Not already voted?
   ↓
7. Create OmrProcessingRequest entity (status: pending)
   ↓
8. Publish processBallotJob to queue
   ↓
9. Worker picks up job
   ↓
10. Worker: Download image from S3
   ↓
11. Worker: Detect ArUco markers
   ↓
12. Worker: Apply perspective correction
   ↓
13. Worker: Verify QR code HMAC
   ↓
14. Worker: Run OMR detection on all fields
   ↓
15. Worker: Return { selections, qrVerified, confidence }
   ↓
16. API receives result
   ↓
17. API: Validate selections against election rules
   ↓
18. API: Create BallotScanResult entity
   ↓
19. If valid: Mark ballot as voted, save result
   ↓
20. Android polls /scan-requests/{id} for status
```

---

## Design Rationale

### Why Clean Architecture?

- **Testability**: Domain logic isolated, can test without NestJS/DB
- **Maintainability**: Business rules in one place (domain layer)
- **Flexibility**: Can swap Drizzle for Prisma without touching domain

### Why CQRS?

- **Performance**: Queries optimized without entity overhead
- **Clarity**: Writes = business logic, Reads = presentation logic
- **Scalability**: Can scale read/write databases separately

### Why Custom Contract System?

- **Type safety**: Single schema for validation + types
- **Developer experience**: Autocomplete, refactoring, compile-time errors
- **Runtime safety**: Zod validates all incoming data
- **Less boilerplate**: No manual DTO classes

### Why Event-Driven?

- **Responsiveness**: API returns immediately, doesn't wait for PDF generation
- **Resilience**: Jobs retry on failure, API doesn't crash if worker is down
- **Scalability**: Can run multiple workers for parallel processing

### Why ArUco + OMR?

- **Robustness**: Handles camera angle, lighting, phone variations
- **Security**: HMAC-signed QR prevents ballot forgery
- **Accuracy**: Multi-metric OMR scoring beats simple thresholds

---

## Lessons Learned

1. **Start with domain model**: Getting entity boundaries right early saves refactoring later
2. **Type-safe contracts pay off**: Catching errors at compile-time > runtime errors in production
3. **Pragmatic CQRS**: Full event sourcing was overkill; commands through domain + direct queries works well
4. **OpenCV is powerful but complex**: Spent significant time tuning ArUco detection and OMR thresholds
5. **Job results need separate queue**: Don't mix job completion events with job data in same queue

---

## Future Improvements

- [ ] Event Sourcing for audit trail (currently just UPDATE queries)
- [ ] Read replicas for query scaling
- [ ] WebSocket for real-time scan status updates (currently polling)
- [ ] Mobile offline mode (queue scans, sync when online)
- [ ] A/B testing for OMR algorithms (different confidence thresholds)
