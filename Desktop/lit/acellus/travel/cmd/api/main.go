/*
what does this file do?
this file is the entry point for the API server
it first connects to the scylla db
then it sets up a web server using gin framework
it defines a health check endpoint
i will add more endpoints to create, read, update, delete journal entries
finally it starts the server on port 8080
so if you run http://localhost:8080/healthz you should get a 200 OK response
additionally i am going to add password hashing and a registration endpoint
*/

package main

import (
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gocql/gocql"
	"golang.org/x/crypto/bcrypt"
)

// entry struct represents a journal entry
// json tags are used as the bridge between the struct and whoever is calling the API
type Entry struct {
	ID        gocql.UUID `json:"id"`      //unique identifier for the entry
	UserID    gocql.UUID `json:"user_id"` //identifier for the user who created the entry
	Title     string     `json:"title"`
	Content   string     `json:"content"`
	Location  string     `json:"location"`
	Photos    []string   `json:"photos"`    //list of photo URLs
	CreatedAt gocql.UUID `json:"created_at"`
	CreatedTS time.Time  `json:"created_ts"`
}

func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	return string(bytes), err
}

// compares a plaintext password with a hashed password and returns true if they match
func CheckPasswordHash(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

func main() {
	//connect to scylla db
	//creates a new cluster configuration
	cluster := gocql.NewCluster("127.0.0.1")
	//tells the driver which keyspace to use
	cluster.Keyspace = "travel"
	//sets the consistency level for queries
	//quorum means that a majority of replicas must respond for the operation to be considered successful
	cluster.Consistency = gocql.Quorum
	//sets a timeout for operations
	cluster.Timeout = 10 * time.Second

	//creates a new session to interact with the database
	session, err := cluster.CreateSession()
	if err != nil {
		log.Fatalf("Failed to connect to ScyllaDB: %v", err)
	}
	defer session.Close()

	//initialize gin router
	r := gin.Default()

	// Serve static files (uploaded photos)
	r.Static("/uploads", "./public/uploads")

	// Add CORS middleware
	r.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(200)
			return
		}

		c.Next()
	})

	//endpoint to check health of the server
	r.GET("/healthz", func(c *gin.Context) {
		c.String(http.StatusOK, "OK")
	})

	// Photo upload endpoint
	r.POST("/upload", func(c *gin.Context) {
		file, header, err := c.Request.FormFile("photo")
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "no file uploaded"})
			return
		}
		defer file.Close()

		// Validate file type
		filename := header.Filename
		ext := strings.ToLower(filepath.Ext(filename))
		if ext != ".jpg" && ext != ".jpeg" && ext != ".png" && ext != ".gif" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "only JPG, PNG and GIF files are allowed"})
			return
		}

		// Generate unique filename
		uniqueFilename := fmt.Sprintf("%d_%s", time.Now().Unix(), filename)
		filepath := filepath.Join("public", "uploads", uniqueFilename)

		// Create the file
		dst, err := os.Create(filepath)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save file"})
			return
		}
		defer dst.Close()

		// Copy the uploaded file to destination
		if _, err := io.Copy(dst, file); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save file"})
			return
		}

		// Return the file URL
		fileURL := "/uploads/" + uniqueFilename
		c.JSON(http.StatusOK, gin.H{"url": fileURL})
	})

	//create a new journal entry
	//now i want to teach the post route to write to both table entries_by_id and entries_by_user
	//switch from a single insert to a batch insert
	r.POST("/entries", func(c *gin.Context) {
		var in struct {
			Title    string   `json:"title" binding:"required"`
			Content  string   `json:"content" binding:"required"`
			Location string   `json:"location"`
			Photos   []string `json:"photos"` // Add photos array
			UserID   string   `json:"user_id"`
		}
		if err := c.BindJSON(&in); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		//generate IDs and timestamps
		//generate a new UUID for the entry
		id, _ := gocql.RandomUUID()
		
		// Use provided user ID or fall back to hardcoded one for testing
		var userID gocql.UUID
		var err error
		if in.UserID != "" {
			userID, err = gocql.ParseUUID(in.UserID)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user_id format"})
				return
			}
		} else {
			// Fallback to hardcoded user ID for testing
			userID, _ = gocql.ParseUUID("550e8400-e29b-41d4-a716-446655440000")
		}
		nowTU := gocql.TimeUUID()
		nowTS := time.Now()

		//create a batch and add 2 inserts
		//execute the batch
		batch := session.NewBatch(gocql.LoggedBatch)
		batch.Query(`INSERT INTO entries_by_id (id, user_id, title, content, location, photos, created_at, created_ts)
					VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
			id, userID, in.Title, in.Content, in.Location, in.Photos, nowTU, nowTS)
		batch.Query(`INSERT INTO entries_by_user (user_id, created_at, id, title, snippet, location, photos)
    				VALUES (?, ?, ?, ?, ?, ?, ?)`,
			userID, nowTU, id, in.Title, in.Content, in.Location, in.Photos)

		if err := session.ExecuteBatch(batch); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		//add a success response so clients know what was created
		c.JSON(http.StatusCreated, gin.H{
			"id":         id.String(),
			"user_id":    userID.String(),
			"created_at": nowTU.String(),
		})
	})

	// get entries for a user
	r.GET("/users/:userId/entries", func(c *gin.Context) {
		userID, err := gocql.ParseUUID(c.Param("userId"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user UUID"})
			return
		}

		var entries []Entry
		const q = `SELECT id, user_id, title, snippet, location, photos, created_at
               FROM entries_by_user WHERE user_id = ? ORDER BY created_at DESC LIMIT 10`

		iter := session.Query(q, userID).Consistency(gocql.One).Iter()
		var e Entry
		for iter.Scan(&e.ID, &e.UserID, &e.Title, &e.Content, &e.Location, &e.Photos, &e.CreatedAt) {
			// Convert TimeUUID to timestamp for frontend display
			e.CreatedTS = e.CreatedAt.Time()
			entries = append(entries, e)
		}

		if err := iter.Close(); err != nil {
			log.Printf("Error closing iterator: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "database error"})
			return
		}

		c.JSON(http.StatusOK, entries)
	})

	// get an entry by id
	r.GET("/entries/:id", func(c *gin.Context) {
		entryID, err := gocql.ParseUUID(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid UUID"})
			return
		}

		var e Entry
		const q = `SELECT id, user_id, title, content, location, created_at, created_ts
               FROM entries_by_id WHERE id = ?`

		if err := session.Query(q, entryID).Consistency(gocql.One).Scan(
			&e.ID, &e.UserID, &e.Title, &e.Content, &e.Location, &e.CreatedAt, &e.CreatedTS,
		); err != nil {
			if err == gocql.ErrNotFound {
				c.JSON(http.StatusNotFound, gin.H{"error": "entry not found"})
			} else {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			}
			return
		}

		c.JSON(http.StatusOK, e)
	})

	//set up a route handler for user registration
	//parse JSON body for username, email, password
	//hash the password using the HashPassword function from internal/domain/user.go
	//generate a new UUID for the user
	//insert that user into the scylla DB
	r.POST("/register", func(c *gin.Context) {
		var in struct {
			Username string `json:"username" binding:"required"`
			Email    string `json:"email" binding:"required,email"`
			Password string `json:"password" binding:"required,min=8"`
		}
		if err := c.BindJSON(&in); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		//hash the password
		hashedPassword, err := HashPassword(in.Password)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to hash password"})
			return
		}
		//generate a new UUID for the user
		userID, _ := gocql.RandomUUID()
		//insert the user into the scylla db
		if err := session.Query(`INSERT INTO users (id, username, email, password_hash) VALUES (?, ?, ?, ?)`,
			userID, in.Username, in.Email, hashedPassword).Exec(); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		//respond with the new user's ID
		c.JSON(http.StatusCreated, gin.H{
			"id": userID.String(),
		})
	})

	//create a POST login route
	//parse JSON body for email and password
	//look up the user by email in the scylla db
	//use CheckPasswordHash function from internal/domain/user.go to verify the password
	//if valid return a JWT token
	r.POST("/login", func(c *gin.Context) {

		//parse JSON body for email and password
		var in struct {
			Email    string `json:"email" binding:"required,email"`
			Password string `json:"password" binding:"required"`
		}
		if err := c.BindJSON(&in); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		//look up the user by email
		var userID gocql.UUID
		var passwordHash string
		var username string
		query := `SELECT id, password_hash, username FROM users WHERE email = ? ALLOW FILTERING`
		log.Printf("Attempting login for email: %s", in.Email)
		if err := session.Query(query, in.Email).Consistency(gocql.One).Scan(&userID, &passwordHash, &username); err != nil {
			log.Printf("Database query failed: %v", err)
			if err == gocql.ErrNotFound {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid email or password"})
			} else {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			}
			return
		}
		log.Printf("Retrieved user data: ID=%s, Username='%s'", userID.String(), username)
		//verify the password
		if !CheckPasswordHash(in.Password, passwordHash) {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid email or password"})
			return
		}
		//for now just return a success message
		//in a real app you would generate and return a JWT token here
		c.JSON(http.StatusOK, gin.H{
			"message":  "login successful",
			"user_id":  userID.String(),
			"username": username,
		})
	})

	//server listens on port from environment variable, defaults to 8080
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Printf("Starting server on :%s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Failed to run server: %v", err)
	}
}
