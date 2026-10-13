import mongoose, { Document, Schema } from 'mongoose';

export type MenuCategory = 'pizzas' | 'burgers' | 'sides' | 'beverages';

export interface IMenuItem extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  description: string;
  price: number;
  category: MenuCategory;
  imageUrl: string;
  isAvailable: boolean;
  rating: number;
  prepTime: string;
  isVeg: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MenuItemSchema = new Schema<IMenuItem>(
  {
    name: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
      maxlength: [120, 'Name cannot exceed 120 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price must be positive'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: ['pizzas', 'burgers', 'sides', 'beverages'],
        message: '{VALUE} is not a supported category',
      },
      index: true,
    },
    imageUrl: {
      type: String,
      required: [true, 'Image URL is required'],
      trim: true,
    },
    isAvailable: {
      type: Boolean,
      default: true,
      index: true,
    },
    rating: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    prepTime: {
      type: String,
      default: '15-20 min',
    },
    isVeg: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, any>) => {
        ret.id = ret._id.toString();
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Text index for search functionality
MenuItemSchema.index({ name: 'text', description: 'text' });

export const MenuItem = mongoose.model<IMenuItem>('MenuItem', MenuItemSchema);
