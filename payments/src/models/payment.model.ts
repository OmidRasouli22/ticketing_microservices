import mongoose from "mongoose";

interface PaymentAttrs {
  orderId: string;
  userId: string;
  amount: number;
  currency?: string;
  chargeId: string;
}
interface PaymentDoc extends mongoose.Document {
  orderId: string;
  userId: string;
  amount: number;
  currency?: string;
  chargeId: string;
}

interface PaymentModel extends mongoose.Model<PaymentDoc> {
  build(attrs: PaymentAttrs): PaymentDoc;
}

const paymentSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      trim: true,
      required: [true, "userId is required"],
    },
    orderId: {
      type: String,
      trim: true,
      required: [true, "orderId is required"],
    },
    chargeId: {
      type: String,
      trim: true,
      required: [true, "chargeId is required"],
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
      },
    },
  }
);

paymentSchema.statics.build = (attrs: PaymentAttrs) => {
  return new Payment(attrs);
};

const Payment = mongoose.model<PaymentDoc, PaymentModel>(
  "Payment",
  paymentSchema
);

export { Payment };
