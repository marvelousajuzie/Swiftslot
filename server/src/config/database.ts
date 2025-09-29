import { Sequelize } from "sequelize"

const sequelize = new Sequelize({
  dialect: "mysql",
  host: process.env.DB_HOST || "localhost",
  port: Number.parseInt(process.env.DB_PORT || "3306"),
  username: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "marvelousajuzie@2025",
  database: process.env.DB_NAME || "swiftslot",
  timezone: "+00:00", // Store everything in UTC
  logging: process.env.NODE_ENV === "development" ? console.log : false,
  define: {
    timestamps: true,
    underscored: false,
  },
})

export default sequelize
