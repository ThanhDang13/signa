import { Email, Password, UserId } from "@signa/api/modules/identity/domain/value-objects";
import { BaseEntity, Accessor } from "@signa/nest-property";

import { type Role } from "@signa/shared";

export class User extends BaseEntity {
  @Accessor({ readonly: true })
  public readonly id!: UserId;

  @Accessor({ readonly: true })
  public readonly email!: Email;

  @Accessor({ touchOnSet: true })
  public fullname!: string;

  @Accessor({ touchOnSet: true })
  public password!: Password;

  @Accessor({ touchOnSet: true, allowUndefined: true })
  public avatar?: string;

  @Accessor({ touchOnSet: true, allowUndefined: true })
  public bio?: string;

  @Accessor({ touchOnSet: true })
  public role!: Role;

  private constructor(
    props: {
      id: UserId;
      email: Email;
      fullname: string;
      password: Password;
      avatar?: string;
      bio?: string;
      role: Role;
    },
    isNew = true
  ) {
    super(isNew);
    this.id = props.id;
    this.email = props.email;
    this.fullname = props.fullname;
    this.password = props.password;
    this.avatar = props.avatar;
    this.bio = props.bio;
    this.role = props.role;
  }

  static create(props: { email: Email; fullname: string; password: Password; role: Role }): User {
    return new User({
      id: UserId.create(),
      email: props.email,
      fullname: props.fullname,
      password: props.password,
      avatar: "",
      bio: "",
      role: props.role
    }).finishInitialization();
  }

  static rehydrate(props: {
    id: string;
    email: string;
    fullname: string;
    passwordHash: string;
    avatar?: string;
    bio?: string;
    role: Role;
    createdAt: string;
    updatedAt: string;
  }): User {
    const user = new User(
      {
        id: UserId.rehydrate(props.id),
        email: Email.rehydrate(props.email),
        fullname: props.fullname,
        password: Password.fromHash(props.passwordHash),
        avatar: props.avatar ?? "",
        bio: props.bio ?? "",
        role: props.role
      },
      false
    );
    user.createdAt = new Date(props.createdAt);
    user.updatedAt = new Date(props.updatedAt);
    return user.finishInitialization();
  }

  updateProfile(fullname: string, avatar?: string, bio?: string) {
    this.fullname = fullname;
    if (avatar !== undefined) this.avatar = avatar;
    if (bio !== undefined) this.bio = bio;
  }

  updateRole(role: Role) {
    this.role = role;
  }
}
