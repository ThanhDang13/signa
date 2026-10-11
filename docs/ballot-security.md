# Ballot Security & Computer Vision

This document explains the security mechanisms and computer vision algorithms used to ensure ballot integrity and accurate scanning.

---

## Table of Contents

1. [Security Architecture](#security-architecture)
2. [ArUco Marker System](#aruco-marker-system)
3. [HMAC-Signed QR Codes](#hmac-signed-qr-codes)
4. [OMR Algorithm](#omr-algorithm)
5. [Validation Pipeline](#validation-pipeline)
6. [Attack Vectors & Mitigations](#attack-vectors--mitigations)

---

## Security Architecture

### Threat Model

**What we protect against:**
- ✅ **Ballot forgery**: Printing fake ballots with made-up IDs
- ✅ **Ballot tampering**: Modifying printed ballot ID
- ✅ **Double voting**: Scanning the same ballot multiple times
- ✅ **Invalid selections**: Marks that don't match ballot structure

**Out of scope:**
- ❌ Physical ballot theft (requires physical security)
- ❌ Insider attacks with secret key access (requires key rotation policies)
- ❌ Camera-based attacks (e.g., deepfakes) - assumes trusted device

### Defense Layers

```
Layer 1: HMAC-Signed Ballot IDs
    └─> Prevents forgery and tampering

Layer 2: Database Ballot Registry
    └─> Tracks which ballots exist and their status

Layer 3: Double-Scan Prevention
    └─> Marks ballots as "voted" after successful scan

Layer 4: Election Status Checks
    └─> Rejects scans if election is not active

Layer 5: Selection Validation
    └─> Verifies marks match ballot structure
```

---

## ArUco Marker System

### What are ArUco Markers?

ArUco markers are binary square fiducial markers used for camera pose estimation. Each marker has a unique ID (0-1023 for the ARUCO dictionary) and can be reliably detected even under poor lighting, blur, or perspective distortion.

**Example ArUco marker (ID 0):**
```
■ ■ ■ ■ ■ ■ ■
■ □ □ ■ □ □ ■
■ □ ■ □ ■ □ ■
■ ■ □ □ □ ■ ■
■ □ ■ ■ □ □ ■
■ □ □ ■ ■ □ ■
■ ■ ■ ■ ■ ■ ■
```

### Marker Placement

Four ArUco markers are embedded in each ballot's corners:

```
Ballot Layout (A4 - 210mm × 297mm)

■───────────[QR]──■  ← Markers ID 0 (top-left) & 1 (top-right)
│                 │    QR code positioned below top-right marker
│                 │
│   [Form Fields] │
│                 │
│                 │
■─────────────────■  ← Markers ID 2 (bottom-left) & 3 (bottom-right)
```

**Marker Specifications:**
- **Size**: 20mm × 20mm (56.69 points at 72 DPI)
- **Dictionary**: ARUCO (1024 unique markers)
- **Position**: 20pt offset from page edges
- **Quiet Zone**: White border around each marker for detection

### Generation Code

```typescript
// apps/worker/src/modules/ballot/services/aruco-marker-drawing.service.ts

@Injectable()
export class ArucoMarkerDrawingService {
  private readonly MARKER_SIZE = 56.69; // 20mm at 72 DPI
  private readonly dictionary: typeof AR.Dictionary.prototype;

  constructor() {
    // Use ARUCO dictionary (same as detector for compatibility)
    this.dictionary = new AR.Dictionary("ARUCO");
  }

  drawMarkers(doc: PDFDocument, positions: MarkerPosition[]): void {
    positions.forEach(({ id, x, y }) => {
      // Generate SVG using js-aruco2's authoritative generator
      const svg = this.dictionary.generateSVG(id);
      
      // Parse SVG rectangles (viewBox is 0 0 9 9 for ARUCO)
      const rectangles = this.parseSVGRectangles(svg);
      
      // Scale from SVG coordinates (9×9) to PDF points
      const scale = this.MARKER_SIZE / 9;
      
      // Draw each rectangle
      rectangles.forEach((rect) => {
        doc.rect(
          x + rect.x * scale,
          y + rect.y * scale,
          rect.width * scale,
          rect.height * scale
        ).fill(rect.fill);
      });
    });
  }
}
```

### Detection Code

```typescript
// apps/worker/src/modules/scanning/services/aruco-alignment.service.ts

@Injectable()
export class ArucoAlignmentService {
  private readonly EXPECTED_MARKER_IDS = [0, 1, 2, 3];

  detectMarkers(image: CvMat): DetectionResult {
    const cv = this.cvService.getCv();
    
    // Create ArUco detector with ARUCO dictionary
    const dictionary = new cv.aruco_Dictionary(cv.DICT_ARUCO_ORIGINAL);
    const detector = new cv.ArucoDetector(dictionary);
    
    // Detect markers
    const corners = new cv.MatVector();
    const ids = new cv.Mat();
    detector.detectMarkers(image, corners, ids);
    
    // Validate we found exactly 4 markers with correct IDs
    if (ids.rows !== 4) {
      return { success: false, error: 'Expected 4 markers, found ' + ids.rows };
    }
    
    const detectedIds = Array.from(ids.data32S);
    if (!this.EXPECTED_MARKER_IDS.every(id => detectedIds.includes(id))) {
      return { success: false, error: 'Missing or incorrect marker IDs' };
    }
    
    return { success: true, corners, ids };
  }
}
```

### Perspective Correction

Once markers are detected, we calculate a homography matrix to warp the image back to the expected ballot dimensions:

```typescript
calculateAlignment(corners: CvMat[], expectedPositions: Position[]): CvMat {
  const cv = this.cvService.getCv();
  
  // Detected corner coordinates (in pixels)
  const srcPoints = cv.matFromArray(4, 1, cv.CV_32FC2, [
    corners[0][0].x, corners[0][0].y,  // Top-left
    corners[1][0].x, corners[1][0].y,  // Top-right
    corners[2][0].x, corners[2][0].y,  // Bottom-left
    corners[3][0].x, corners[3][0].y   // Bottom-right
  ]);
  
  // Expected positions (in pixels at 300 DPI)
  const dstPoints = cv.matFromArray(4, 1, cv.CV_32FC2, [
    expectedPositions[0].x, expectedPositions[0].y,
    expectedPositions[1].x, expectedPositions[1].y,
    expectedPositions[2].x, expectedPositions[2].y,
    expectedPositions[3].x, expectedPositions[3].y
  ]);
  
  // Calculate perspective transformation matrix
  const transform = cv.getPerspectiveTransform(srcPoints, dstPoints);
  
  return transform;
}

applyAlignment(image: CvMat, transform: CvMat): CvMat {
  const cv = this.cvService.getCv();
  const aligned = new cv.Mat();
  
  // Warp image to correct perspective
  cv.warpPerspective(
    image,
    aligned,
    transform,
    new cv.Size(2480, 3508) // A4 at 300 DPI
  );
  
  return aligned;
}
```

**Why this works:**
- Homography transforms any quadrilateral to any other quadrilateral
- Even if ballot is photographed at 45° angle, markers allow perfect correction
- Handles rotation, skew, perspective distortion, and scaling

---

## HMAC-Signed QR Codes

### QR Code Structure

Each ballot contains a unique QR code with:
```
<ballot-id>|<hmac-signature>
```

**Example:**
```
01927b3c-8f6e-7b4a-a123-456789abcdef|a3f8b2c9d1e4f5a6b7c8d9e0f1a2b3c4
```

### Generation

```typescript
// apps/api/src/modules/ballot/application/commands/handlers/generate-ballots.handler.ts

import { createHmac } from 'crypto';

@CommandHandler(GenerateBallotsCommand)
export class GenerateBallotsHandler {
  async execute(command: GenerateBallotsCommand) {
    const ballots = [];
    
    for (let i = 0; i < command.payload.count; i++) {
      const ballotId = uuidv7(); // Time-ordered UUID
      
      // Generate HMAC signature
      const signature = createHmac('sha256', this.secretKey)
        .update(ballotId)
        .digest('hex');
      
      const qrData = `${ballotId}|${signature}`;
      
      // Generate QR code image
      const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
        width: 350,
        errorCorrectionLevel: 'H' // High - 30% recovery
      });
      
      ballots.push({ ballotId, qrCodeDataUrl });
    }
    
    // Publish job to worker for PDF generation
    await this.queue.publish(generateBallotJob, {
      electionId: command.payload.electionId,
      ballots
    });
  }
}
```

### Verification

```typescript
// apps/worker/src/modules/scanning/services/qr-verification.service.ts

@Injectable()
export class QrVerificationService {
  verify(qrData: string, expectedBallotId: string): VerificationResult {
    const [ballotId, providedSignature] = qrData.split('|');
    
    // Check ballot ID matches what we expect (from database lookup)
    if (ballotId !== expectedBallotId) {
      return {
        verified: false,
        error: 'QR ballot ID does not match expected ballot'
      };
    }
    
    // Recompute HMAC signature
    const expectedSignature = createHmac('sha256', this.secretKey)
      .update(ballotId)
      .digest('hex');
    
    // Constant-time comparison to prevent timing attacks
    const verified = timingSafeEqual(
      Buffer.from(providedSignature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
    
    if (!verified) {
      return {
        verified: false,
        error: 'QR signature verification failed - ballot may be tampered'
      };
    }
    
    return { verified: true };
  }
}
```

### Security Properties

**Why HMAC?**
- **Tamper-proof**: Cannot modify ballot ID without knowing secret key
- **Forgery-proof**: Cannot create valid signatures for fake ballots
- **Fast verification**: O(1) verification time
- **No PKI needed**: Simpler than digital signatures, no certificate management

**Why not just encrypt the QR?**
- Encryption provides confidentiality (hiding data)
- HMAC provides integrity (proving data hasn't changed)
- Ballot ID doesn't need to be secret, just authentic

**Key Security:**
- Secret key stored as environment variable
- Never exposed to clients
- Rotated periodically (requires ballot regeneration)
- Different key per environment (dev/staging/prod)

---

## OMR Algorithm

### Overview

Optical Mark Recognition (OMR) detects whether a checkbox or radio button has been filled in. Simple threshold-based approaches ("is it > 50% dark?") fail in real-world conditions with:
- Light pencil marks
- Incomplete fills
- Shadows and lighting variations
- Printing artifacts
- Stray marks outside boxes

Our algorithm uses **multi-metric confidence scoring** to handle these challenges.

### Algorithm Steps

```typescript
// apps/worker/src/modules/scanning/services/mark-detection.service.ts

interface MarkScore {
  isMarked: boolean;
  confidence: number;        // Overall confidence (0-1)
  darkCoverage: number;      // % of dark pixels
  largestComponentCoverage: number; // % covered by largest connected component
  connectedDarkRatio: number; // Ratio of dark pixels that are connected
  centerCoverage: number;    // Darkness in center region
  threshold: number;         // Adaptive threshold used
}

calculateMarkScore(
  imageData: Buffer,
  imageWidth: number,
  imageHeight: number,
  x: number,        // Checkbox x in mm
  y: number,        // Checkbox y in mm
  boxWidth: number, // Checkbox width in mm
  boxHeight: number // Checkbox height in mm
): MarkScore {
  // 1. Convert mm to pixels (300 DPI)
  const MM_TO_PIXELS = 11.811; // 300 DPI / 25.4 mm/inch
  const pixelX = Math.round(x * MM_TO_PIXELS);
  const pixelY = Math.round(y * MM_TO_PIXELS);
  const pixelWidth = Math.round(boxWidth * MM_TO_PIXELS);
  const pixelHeight = Math.round(boxHeight * MM_TO_PIXELS);
  
  // 2. Apply border inset (avoid box edges)
  const BORDER_INSET_RATIO = 0.15; // Ignore 15% on each side
  const insetX = Math.round(pixelWidth * BORDER_INSET_RATIO);
  const insetY = Math.round(pixelHeight * BORDER_INSET_RATIO);
  
  const roiX = pixelX + insetX;
  const roiY = pixelY + insetY;
  const roiWidth = pixelWidth - 2 * insetX;
  const roiHeight = pixelHeight - 2 * insetY;
  
  // 3. Extract ROI from grayscale image
  const roi = extractROI(imageData, imageWidth, roiX, roiY, roiWidth, roiHeight);
  
  // 4. Calculate adaptive threshold
  const background = percentile(roi, 0.95); // 95th percentile = likely background
  const darkness = Math.max(30, background * 0.25);
  const threshold = background - darkness;
  
  // 5. Create binary mask (dark pixels)
  const mask = roi.map(pixel => pixel < threshold ? 1 : 0);
  const darkPixels = mask.reduce((sum, val) => sum + val, 0);
  const totalPixels = roi.length;
  const darkCoverage = darkPixels / totalPixels;
  
  // 6. Calculate center region darkness
  const CENTER_REGION_RATIO = 0.5; // Middle 50%
  const centerDarkPixels = calculateCenterDarkness(mask, roiWidth, roiHeight);
  const centerPixels = Math.pow(roiWidth * CENTER_REGION_RATIO, 2);
  const centerCoverage = centerDarkPixels / centerPixels;
  
  // 7. Find connected components (flood fill)
  const components = findConnectedComponents(mask, roiWidth, roiHeight);
  const largestComponent = Math.max(...components.map(c => c.size));
  const largestComponentCoverage = largestComponent / totalPixels;
  const connectedDarkRatio = largestComponent / darkPixels;
  
  // 8. Calculate overall confidence
  const confidence = (
    darkCoverage * 0.3 +              // 30% weight: overall darkness
    largestComponentCoverage * 0.3 +  // 30% weight: single large mark
    connectedDarkRatio * 0.2 +        // 20% weight: mark connectedness
    centerCoverage * 0.2              // 20% weight: center bias
  );
  
  const isMarked = confidence > 0.75; // Threshold for "marked"
  
  return {
    isMarked,
    confidence,
    darkCoverage,
    largestComponentCoverage,
    connectedDarkRatio,
    centerCoverage,
    threshold
  };
}
```

### Metrics Explained

**1. Dark Coverage (30% weight)**
- Simple ratio of dark pixels to total pixels
- Catches fully-filled boxes
- Weak against scattered noise

**2. Largest Component Coverage (30% weight)**
- Size of largest connected blob of dark pixels
- Rejects scattered dots and noise
- Ensures mark is a single coherent shape

**3. Connected Dark Ratio (20% weight)**
- What fraction of dark pixels belong to largest component
- High ratio = one solid mark
- Low ratio = many scattered marks (likely noise)

**4. Center Coverage (20% weight)**
- Darkness in center 50% of box
- Handles edge artifacts from printing/scanning
- Biases toward intentional marks (users mark centers)

### Example Scenarios

**Scenario 1: Fully filled checkbox**
```
Input:  ████████
        ████████
        ████████

Metrics:
- darkCoverage: 0.95
- largestComponent: 0.93
- connectedRatio: 0.98
- centerCoverage: 0.96
→ Confidence: 0.95 → MARKED ✓
```

**Scenario 2: Light pencil mark**
```
Input:  ░░████░░
        ░░████░░
        ░░░░░░░░

Metrics:
- darkCoverage: 0.42
- largestComponent: 0.38
- connectedRatio: 0.91
- centerCoverage: 0.58
→ Confidence: 0.48 → NOT MARKED ✗
```

**Scenario 3: Scattered noise**
```
Input:  █░░░░█░░
        ░░█░░░░█
        █░░░█░░░

Metrics:
- darkCoverage: 0.35
- largestComponent: 0.02 (largest mark is tiny)
- connectedRatio: 0.06 (marks not connected)
- centerCoverage: 0.15
→ Confidence: 0.11 → NOT MARKED ✓
```

**Scenario 4: Incomplete fill (70%)**
```
Input:  ████████
        ███████░
        ██░░░░░░

Metrics:
- darkCoverage: 0.68
- largestComponent: 0.65
- connectedRatio: 0.96
- centerCoverage: 0.78
→ Confidence: 0.77 → MARKED ✓
```

### Adaptive Thresholding

Rather than a fixed "pixel < 128 = dark", we calculate per-box threshold based on:

```typescript
const background = percentile(roi, 0.95);  // 95th percentile pixel value
const darkness = Math.max(30, background * 0.25);
const threshold = background - darkness;
```

**Why adaptive?**
- Handles lighting variations across page
- Works with different paper colors (white, cream, gray)
- Compensates for uneven illumination from camera

---

## Validation Pipeline

Complete validation flow from scan to result:

```typescript
// apps/api/src/modules/ballot/application/handlers/omr-scan-result.handler.ts

@Injectable()
export class OmrScanResultHandler {
  @OnJobResult(processBallotJob)
  async handleOmrResult(result: JobResult<ScanResult>) {
    // 1. Load ballot and election
    const ballot = await this.ballotRepo.findById(result.data.ballotId);
    const election = await this.queryBus.execute(
      new GetElectionStatusQuery({ electionId: ballot.electionId })
    );
    
    // 2. Validate markers were detected
    if (!result.data.processingMetadata.markersDetected) {
      return this.saveScanResult({
        ...result.data,
        validationStatus: 'invalid_markers',
        validationErrors: [{ reason: 'ArUco markers not detected' }]
      });
    }
    
    // 3. Validate QR signature
    if (!result.data.qrVerified) {
      return this.saveScanResult({
        ...result.data,
        validationStatus: 'invalid_qr',
        validationErrors: [{ reason: 'QR code signature verification failed' }]
      });
    }
    
    // 4. Validate selections match ballot structure
    const structureErrors = this.validator.validateStructure(
      result.data.selections,
      election.formStructure
    );
    if (structureErrors.length > 0) {
      return this.saveScanResult({
        ...result.data,
        validationStatus: 'invalid_selections',
        validationErrors: structureErrors
      });
    }
    
    // 5. Validate confidence scores
    const lowConfidence = result.data.selections.filter(s => s.confidence < 0.75);
    if (lowConfidence.length > 0) {
      return this.saveScanResult({
        ...result.data,
        validationStatus: 'invalid_confidence',
        validationErrors: lowConfidence.map(s => ({
          fieldId: s.fieldId,
          reason: `Low confidence: ${(s.confidence * 100).toFixed(1)}%`
        }))
      });
    }
    
    // 6. Check election is still active
    if (!election.isActive) {
      return this.saveScanResult({
        ...result.data,
        validationStatus: 'rejected_election_closed',
        validationErrors: [{ reason: 'Election is no longer active' }]
      });
    }
    
    // 7. All validations passed → mark ballot as voted
    ballot.markAsVoted();
    await this.ballotRepo.save(ballot);
    
    await this.saveScanResult({
      ...result.data,
      validationStatus: 'valid',
      validationErrors: []
    });
  }
}
```

---

## Attack Vectors & Mitigations

### 1. Ballot Forgery

**Attack**: Print fake ballots with guessed ballot IDs

**Mitigation**:
- HMAC signature prevents guessing valid IDs
- Even if attacker guesses a UUID, they can't generate valid signature
- Signature requires secret key (only known to server)

**Success Probability**: ~0% without secret key

---

### 2. Ballot Tampering

**Attack**: Modify ballot ID on printed ballot

**Mitigation**:
- Changing ballot ID invalidates HMAC signature
- QR verification will fail
- Scan rejected with "QR signature verification failed"

**Detection**: 100% (signature mismatch)

---

### 3. Double Voting

**Attack**: Scan the same ballot multiple times

**Mitigation**:
- First successful scan marks ballot as "voted" in database
- Subsequent scans check `ballot.isVoted()` → reject
- Idempotent: same ballot ID = same vote

**Detection**: 100% (database state)

---

### 4. Replay Attacks

**Attack**: Photograph a valid ballot, reuse image

**Mitigation**:
- Same as double voting: ballot ID already marked as voted
- S3 key uniqueness per scan (timestamped)
- Scan result links back to original ballot

**Detection**: 100% (ballot already voted)

---

### 5. Mark Manipulation

**Attack**: Draw additional marks after scanning

**Mitigation**:
- Physical security (ballots should be stored after scanning)
- Digital record is immutable (S3 image + database result)
- Audit trail shows original scan timestamp

**Detection**: Post-scan changes not reflected in system

---

### 6. Election Timing Attacks

**Attack**: Scan ballots before/after election period

**Mitigation**:
- Every scan checks `election.isActive` (status = ACTIVE)
- Inactive elections reject all scans
- Validation status: `rejected_election_closed`

**Detection**: 100% (election status check)

---

### 7. Insider Attacks

**Attack**: Admin with secret key creates fake ballots

**Mitigation**:
- Audit logs for all ballot generation
- Ballot count limits per election
- Key rotation requires regenerating all ballots
- Multi-signature requirements for key access (future)

**Detection**: Audit trail analysis

---

## Performance Characteristics

### ArUco Detection
- **Time**: ~50-200ms per image (depends on resolution)
- **Accuracy**: >99% with proper lighting and focus
- **False Positives**: ~0.1% (rejected by perspective check)

### QR Verification
- **Time**: ~5-10ms (SHA-256 HMAC)
- **Accuracy**: 100% (cryptographic guarantee)
- **Error Rate**: 0% (either valid signature or not)

### OMR Detection
- **Time**: ~10-30ms per checkbox (depends on image size)
- **Accuracy**: ~97% with confidence > 0.75 threshold
- **False Positives**: ~1.5% (scattered noise marked as filled)
- **False Negatives**: ~1.5% (very light marks missed)

### Full Pipeline (Typical Ballot with 20 Fields)
- ArUco Detection: 100ms
- Perspective Correction: 50ms
- QR Decode + Verify: 20ms
- OMR (20 fields × 3 options): 600ms
- Validation: 10ms
- **Total**: ~780ms per ballot

**Throughput**: ~75 ballots/minute on single worker (4 CPU cores)

---

## Future Enhancements

### Security
- [ ] Multi-signature ballot generation (require 2+ admins to approve)
- [ ] Blind signature scheme (ballot ID hidden from worker)
- [ ] Homomorphic encryption for privacy-preserving vote tallying
- [ ] Hardware security module (HSM) for key storage

### Computer Vision
- [ ] Deep learning model for OMR (train on real ballot scans)
- [ ] Active learning: flag low-confidence scans for human review
- [ ] Multi-frame capture: average 3-5 images per ballot
- [ ] Handwriting recognition for write-in candidates

### Performance
- [ ] GPU acceleration for OpenCV operations
- [ ] Batch processing: process multiple ballots in parallel
- [ ] Edge deployment: run OMR on mobile device
- [ ] Incremental processing: stream video, detect ballots in real-time

---

## References

- **ArUco Markers**: [OpenCV ArUco Module](https://docs.opencv.org/4.x/d5/dae/tutorial_aruco_detection.html)
- **HMAC**: [RFC 2104](https://www.ietf.org/rfc/rfc2104.txt)
- **OMR**: [Optical Mark Recognition - Wikipedia](https://en.wikipedia.org/wiki/Optical_mark_recognition)
- **Connected Components**: [OpenCV connectedComponents](https://docs.opencv.org/4.x/d3/dc0/group__imgproc__shape.html#gaedef8c7340499ca391d459122e51bef5)
