import express from "express"
import cors from "cors"
import helmet from "helmet"
import { sequelize } from "./models"
import routes from "./routes"

console.log("DEBUG: Routes imported:", routes)

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(helmet())
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  }),
)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Request debugging middleware - ADDED BEFORE ROUTES
app.use((req, res, next) => {
  console.log(`=== INCOMING REQUEST ===`)
  console.log(`Method: ${req.method}`)
  console.log(`URL: ${req.url}`)
  console.log(`Path: ${req.path}`)
  console.log(`Original URL: ${req.originalUrl}`)
  console.log(`Headers:`, {
    'content-type': req.headers['content-type'],
    'user-agent': req.headers['user-agent']?.slice(0, 50),
    'idempotency-key': req.headers['idempotency-key']
  })
  console.log(`Body:`, req.body)
  console.log(`=== END REQUEST ===`)
  next()
})

// Routes
console.log("DEBUG: Registering routes under /api")
app.use("/api", routes)

// Add route debugging
console.log("DEBUG: Registered routes:")
app._router.stack.forEach((r: any) => {
  if (r.route) {
    console.log(`Direct: ${Object.keys(r.route.methods)} ${r.route.path}`)
  } else if (r.name === 'router') {
    console.log("Router middleware found")
    if (r.handle && r.handle.stack) {
      r.handle.stack.forEach((layer: any) => {
        if (layer.route) {
          console.log(`  API Route: ${Object.keys(layer.route.methods)} /api${layer.route.path}`)
        }
      })
    }
  }
})

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() })
})

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Unhandled error:", err)
  res.status(500).json({
    success: false,
    error: "Internal server error",
  })
})

// 404 handler - Add debugging here too
app.use("*", (req, res) => {
  console.log(`DEBUG: 404 - Route not found: ${req.method} ${req.originalUrl}`)
  res.status(404).json({
    success: false,
    error: "Route not found",
  })
})

// Start server
async function startServer() {
  try {
    // Test database connection
    await sequelize.authenticate()
    console.log("Database connection established successfully.")

    // Sync models (in production, use migrations instead)
    if (process.env.NODE_ENV !== "production") {
      await sequelize.sync({ alter: true })
      console.log("Database models synchronized.")
    }

    app.listen(PORT, () => {
      console.log(`SwiftSlot API server running on port ${PORT}`)
      console.log(`Environment: ${process.env.NODE_ENV || "development"}`)
    })
  } catch (error) {
    console.error("Failed to start server:", error)
    process.exit(1)
  }
}

startServer()