import { DataTypes, Model } from "sequelize"
import sequelize from "../config/database"

// Vendor Model
export class Vendor extends Model {
  public id!: number
  public name!: string
  public timezone!: string
  public readonly createdAt!: Date
}

Vendor.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    timezone: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "Africa/Lagos",
    },
  },
  {
    sequelize,
    modelName: "Vendor",
    tableName: "vendors",
  },
)

// Booking Model
export class Booking extends Model {
  public id!: number
  public vendorId!: number
  public buyerId!: string
  public startTimeUtc!: Date
  public endTimeUtc!: Date
  public status!: "pending" | "paid" | "cancelled"
  public readonly createdAt!: Date
}

Booking.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    vendorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "vendor_id",
    },
    buyerId: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "anonymous",
      field: "buyer_id",
    },
    startTimeUtc: {
      type: DataTypes.DATE(3),
      allowNull: false,
      field: "start_time_utc",
    },
    endTimeUtc: {
      type: DataTypes.DATE(3),
      allowNull: false,
      field: "end_time_utc",
    },
    status: {
      type: DataTypes.ENUM("pending", "paid", "cancelled"),
      defaultValue: "pending",
    },
  },
  {
    sequelize,
    modelName: "Booking",
    tableName: "bookings",
  },
)

// BookingSlot Model
export class BookingSlot extends Model {
  public id!: number
  public bookingId!: number
  public vendorId!: number
  public slotStartUtc!: Date
  public readonly createdAt!: Date
}

BookingSlot.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    bookingId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "booking_id",
    },
    vendorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "vendor_id",
    },
    slotStartUtc: {
      type: DataTypes.DATE(3),
      allowNull: false,
      field: "slot_start_utc",
    },
  },
  {
    sequelize,
    modelName: "BookingSlot",
    tableName: "booking_slots",
    indexes: [
      {
        unique: true,
        fields: ["vendor_id", "slot_start_utc"],
        name: "unique_vendor_slot",
      },
    ],
  },
)

// Payment Model
export class Payment extends Model {
  public id!: number
  public bookingId!: number
  public ref!: string
  public status!: "pending" | "success" | "failed"
  public rawEventJson!: object
  public readonly createdAt!: Date


 
  // public Booking?: Booking
}

Payment.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    bookingId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "booking_id",
    },
    ref: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    status: {
      type: DataTypes.ENUM("pending", "success", "failed"),
      defaultValue: "pending",
    },
    rawEventJson: {
      type: DataTypes.JSON,
      field: "raw_event_json",
    },
  },
  {
    sequelize,
    modelName: "Payment",
    tableName: "payments",
  },
)

// IdempotencyKey Model
export class IdempotencyKey extends Model {
  public keyValue!: string
  public scope!: string
  public responseHash!: string
  public responseData!: object
  public readonly createdAt!: Date
}

IdempotencyKey.init(
  {
    keyValue: {
      type: DataTypes.STRING,
      primaryKey: true,
      field: "key_value",
    },
    scope: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    responseHash: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "response_hash",
    },
    responseData: {
      type: DataTypes.JSON,
      field: "response_data",
    },
  },
  {
    sequelize,
    modelName: "IdempotencyKey",
    tableName: "idempotency_keys",
  },
)

// Associations
Vendor.hasMany(Booking, { foreignKey: "vendorId" })
Booking.belongsTo(Vendor, { foreignKey: "vendorId" })

Booking.hasMany(BookingSlot, { foreignKey: "bookingId" })
BookingSlot.belongsTo(Booking, { foreignKey: "bookingId" })

Vendor.hasMany(BookingSlot, { foreignKey: "vendorId" })
BookingSlot.belongsTo(Vendor, { foreignKey: "vendorId" })

Booking.hasOne(Payment, { foreignKey: "bookingId" })
Payment.belongsTo(Booking, { foreignKey: "bookingId" })

export { sequelize }
