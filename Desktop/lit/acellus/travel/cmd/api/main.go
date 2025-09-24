/*
Travel Journal API with PostgreSQL
Handles user authentication and journal entries with photo uploads
*/

package main

import (
	"database/sql"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	_ "github.com/lib/pq"
	"golang.org/x/crypto/bcrypt"
)

// Entry struct represents a journal entry
type Entry struct {
	ID        int       `json:"id" db:"id"`
	UserID    int       `json:"user_id" db:"user_id"`
	Title     string    `json:"title" db:"title"`
	Content   string    `json:"content" db:"content"`
	Location  string    `json:"location" db:"location"`
	Photos    []string  `json:"photos"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
}

type RegisterRequest struct {
	Username string `json:"username"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type EntryRequest struct {
	UserID   string   `json:"user_id"`
	Title    string   `json:"title"`
	Content  string   `json:"content"`
	Location string   `json:"location"`
	Photos   []string `json:"photos"`
}

var db *sql.DB

func initDB() {
	var err error
	
	// Get database URL from environment (Railway provides this)
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		// Fallback for local development
		dbURL = "postgres://localhost/travel?sslmode=disable"
	}

	db, err = sql.Open("postgres", dbURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// Test connection
	if err = db.Ping(); err != nil {
		log.Fatalf("Failed to ping database: %v", err)
	}

	log.Println("Connected to PostgreSQL database successfully")

	// Create tables
	createTables()
}

func createTables() {
	// Create users table
	userTable := `
	CREATE TABLE IF NOT EXISTS users (
		id SERIAL PRIMARY KEY,
		username VARCHAR(255) UNIQUE NOT NULL,
		email VARCHAR(255) UNIQUE NOT NULL,
		password_hash VARCHAR(255) NOT NULL,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	)`

	// Create entries table
	entryTable := `
	CREATE TABLE IF NOT EXISTS entries (
		id SERIAL PRIMARY KEY,
		user_id INTEGER REFERENCES users(id),
		title VARCHAR(255) NOT NULL,
		content TEXT NOT NULL,
		location VARCHAR(255),
		photos TEXT[], -- PostgreSQL array for photos
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	)`

	if _, err := db.Exec(userTable); err != nil {
		log.Fatalf("Failed to create users table: %v", err)
	}

	if _, err := db.Exec(entryTable); err != nil {
		log.Fatalf("Failed to create entries table: %v", err)
	}

	log.Println("Database tables created successfully")
}

// Hash password using bcrypt
func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), 14)
	return string(bytes), err
}

// Check password hash
func CheckPasswordHash(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

func main() {
	// Initialize database
	initDB()
	defer db.Close()

	// Initialize Gin router
	r := gin.Default()

	// CORS middleware
	r.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	// Serve static files (uploaded photos)
	r.Static("/uploads", "./public/uploads")

	// Health check endpoint
	r.GET("/healthz", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	// Photo upload endpoint
	r.POST("/upload", func(c *gin.Context) {
		file, header, err := c.Request.FormFile("photo")
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "No file uploaded"})
			return
		}
		defer file.Close()

		// Validate file type
		filename := header.Filename
		ext := strings.ToLower(filepath.Ext(filename))
		if ext != ".jpg" && ext != ".jpeg" && ext != ".png" && ext != ".gif" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Only JPG, PNG, and GIF files are allowed"})
			return
		}

		// Create unique filename
		timestamp := time.Now().Unix()
		newFilename := fmt.Sprintf("%d_%s", timestamp, filename)
		filepath := fmt.Sprintf("./public/uploads/%s", newFilename)

		// Create uploads directory if it doesn't exist
		os.MkdirAll("./public/uploads", 0755)

		// Save file
		out, err := os.Create(filepath)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
			return
		}
		defer out.Close()

		_, err = io.Copy(out, file)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
			return
		}

		// Return the file URL
		fileURL := fmt.Sprintf("/uploads/%s", newFilename)
		c.JSON(http.StatusOK, gin.H{"url": fileURL})
	})

	// Create entry endpoint
	r.POST("/entries", func(c *gin.Context) {
		var in EntryRequest
		if err := c.ShouldBindJSON(&in); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Convert user_id string to int
		userID, err := strconv.Atoi(in.UserID)
		if err != nil {
			// Default user for now
			userID = 1
		}

		// Convert photos slice to PostgreSQL array format
		photosArray := "{}"
		if len(in.Photos) > 0 {
			photosArray = "{\"" + strings.Join(in.Photos, "\",\"") + "\"}"
		}

		query := `
		INSERT INTO entries (user_id, title, content, location, photos, created_at) 
		VALUES ($1, $2, $3, $4, $5, $6) 
		RETURNING id`

		var entryID int
		err = db.QueryRow(query, userID, in.Title, in.Content, in.Location, photosArray, time.Now()).Scan(&entryID)
		if err != nil {
			log.Printf("Failed to insert entry: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create entry"})
			return
		}

		c.JSON(http.StatusCreated, gin.H{
			"message": "Entry created successfully",
			"id":      entryID,
		})
	})

	// Get entries for a user
	r.GET("/entries/:userId", func(c *gin.Context) {
		userIDStr := c.Param("userId")
		userID, err := strconv.Atoi(userIDStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
			return
		}

		query := `
		SELECT id, user_id, title, content, location, photos, created_at 
		FROM entries 
		WHERE user_id = $1 
		ORDER BY created_at DESC`

		rows, err := db.Query(query, userID)
		if err != nil {
			log.Printf("Database query failed: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Database query failed"})
			return
		}
		defer rows.Close()

		var entries []Entry
		for rows.Next() {
			var entry Entry
			var photosStr string

			err := rows.Scan(
				&entry.ID,
				&entry.UserID,
				&entry.Title,
				&entry.Content,
				&entry.Location,
				&photosStr,
				&entry.CreatedAt,
			)
			if err != nil {
				log.Printf("Failed to scan row: %v", err)
				continue
			}

			// Parse PostgreSQL array format to Go slice
			entry.Photos = parsePostgresArray(photosStr)
			entries = append(entries, entry)
		}

		c.JSON(http.StatusOK, entries)
	})

	// Get single entry
	r.GET("/entry/:id", func(c *gin.Context) {
		entryIDStr := c.Param("id")
		entryID, err := strconv.Atoi(entryIDStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid entry ID"})
			return
		}

		query := `
		SELECT id, user_id, title, content, location, photos, created_at 
		FROM entries 
		WHERE id = $1`

		var entry Entry
		var photosStr string

		err = db.QueryRow(query, entryID).Scan(
			&entry.ID,
			&entry.UserID,
			&entry.Title,
			&entry.Content,
			&entry.Location,
			&photosStr,
			&entry.CreatedAt,
		)

		if err != nil {
			if err == sql.ErrNoRows {
				c.JSON(http.StatusNotFound, gin.H{"error": "Entry not found"})
			} else {
				log.Printf("Database query failed: %v", err)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Database query failed"})
			}
			return
		}

		entry.Photos = parsePostgresArray(photosStr)
		c.JSON(http.StatusOK, entry)
	})

	// Register endpoint
	r.POST("/register", func(c *gin.Context) {
		var in RegisterRequest
		if err := c.ShouldBindJSON(&in); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Hash the password
		hashedPassword, err := HashPassword(in.Password)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
			return
		}

		query := `
		INSERT INTO users (username, email, password_hash) 
		VALUES ($1, $2, $3) 
		RETURNING id`

		var userID int
		err = db.QueryRow(query, in.Username, in.Email, hashedPassword).Scan(&userID)
		if err != nil {
			if strings.Contains(err.Error(), "duplicate key") {
				c.JSON(http.StatusConflict, gin.H{"error": "User already exists"})
			} else {
				log.Printf("Failed to register user: %v", err)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Registration failed"})
			}
			return
		}

		c.JSON(http.StatusCreated, gin.H{
			"message": "User registered successfully",
			"user_id": userID,
		})
	})

	// Login endpoint
	r.POST("/login", func(c *gin.Context) {
		var in LoginRequest
		if err := c.ShouldBindJSON(&in); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		query := `SELECT id, username, password_hash FROM users WHERE email = $1`

		var userID int
		var username, passwordHash string
		err := db.QueryRow(query, in.Email).Scan(&userID, &username, &passwordHash)

		if err != nil {
			if err == sql.ErrNoRows {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
			} else {
				log.Printf("Database query failed: %v", err)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Login failed"})
			}
			return
		}

		// Verify password
		if !CheckPasswordHash(in.Password, passwordHash) {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"message":  "Login successful",
			"user_id":  userID,
			"username": username,
		})
	})

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Printf("Starting server on :%s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Failed to run server: %v", err)
	}
}

// Helper function to parse PostgreSQL array format
func parsePostgresArray(s string) []string {
	if s == "{}" || s == "" {
		return []string{}
	}
	
	// Remove curly braces and split by comma
	s = strings.Trim(s, "{}")
	if s == "" {
		return []string{}
	}
	
	parts := strings.Split(s, ",")
	result := make([]string, len(parts))
	for i, part := range parts {
		result[i] = strings.Trim(part, "\"")
	}
	return result
}