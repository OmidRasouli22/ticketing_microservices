import mongoose, { Schema, Document, Model, SchemaOptions } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUserAttributes {
  email: string;
  password: string;
}

interface IUserDocument extends Document {
  email: string;
  password: string;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

interface IUserModel extends Model<IUserDocument> {
  build(attrs: IUserAttributes): IUserDocument;
}

const userSchemaDefinition: Record<keyof IUserAttributes, any> = {
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    validate: {
      validator: (email: string) =>
        /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email),
      message: "Invalid email format",
    },
  },
  password: {
    type: String,
    required: true,
    trim: true,
    minlength: 6,
  },
};

export const removeSensitiveFields = (doc: any, ret: any) => {
  ret.id = ret._id; // Convert `_id` to `id`
  delete ret._id;
  delete ret.password;
  delete ret.__v;
  return ret;
};

const userSchemaOptions: SchemaOptions = {
  timestamps: true,
  toJSON: { transform: removeSensitiveFields },
  toObject: { transform: removeSensitiveFields }, // Ensures consistency
};

const userSchema = new Schema(userSchemaDefinition, userSchemaOptions);

// Hash password before saving
userSchema.pre<IUserDocument>("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Static build method for type safety
userSchema.statics.build = (attrs: IUserAttributes): IUserDocument => {
  return new User(attrs);
};

export const User = mongoose.model<IUserDocument, IUserModel>(
  "User",
  userSchema
);
