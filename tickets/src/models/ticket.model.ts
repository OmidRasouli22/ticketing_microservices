import mongoose, { Schema, Document, Model, SchemaOptions } from "mongoose";
import { updateIfCurrentPlugin } from "mongoose-update-if-current";

// Define the attributes for the Ticket model
export interface ITicketAttributes {
  title: string;
  price: number;
  userId: string;
}

// Define the Mongoose Document (includes mongoose-specific properties like _id)
export interface ITicketDocument extends Document {
  id: string;
  title: string;
  price: number;
  userId: string;
  orderId?: string;
  version: number;
  createdAt: string;
}

// Define the Mongoose Model interface (includes custom methods like build)
export interface ITicketModel extends Model<ITicketDocument> {
  build(attrs: ITicketAttributes): ITicketDocument;
}

// Schema definition with validation rules
const ticketSchemaDefinition = {
  title: {
    type: String,
    required: [true, "Title is required."],
    minlength: [5, "Title must be at least 5 characters long."],
    trim: true,
  },
  price: {
    type: Number,
    required: [true, "Price is required."],
    min: [0, "Price must be a positive number."],
  },
  userId: {
    type: String,
    required: [true, "User ID is required."],
    trim: true,
  },
  orderId: {
    type: String,
    required: false,
  },
};

// Helper function to transform the document (remove _id and __v, set id)
const removeSensitiveFields = (doc: any, ret: any) => {
  ret.id = ret._id; // Convert `_id` to `id`
  delete ret._id;
  return ret;
};

// Schema options to handle timestamps and custom transformation on JSON/Object serialization
const ticketSchemaOptions: SchemaOptions = {
  timestamps: true,
  toJSON: { transform: removeSensitiveFields },
  toObject: { transform: removeSensitiveFields },
};

// Create the schema with validation and transformation options
const ticketSchema = new Schema(ticketSchemaDefinition, ticketSchemaOptions);

ticketSchema.set("versionKey", "version");
ticketSchema.plugin(updateIfCurrentPlugin);

// Static method to create a Ticket (for type safety)
ticketSchema.statics.build = (attrs: ITicketAttributes): ITicketDocument => {
  return new Ticket(attrs);
};

// Create the model from the schema and export it
export const Ticket = mongoose.model<ITicketDocument, ITicketModel>(
  "Ticket",
  ticketSchema
);
