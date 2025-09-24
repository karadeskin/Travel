/*
this file declares a user struct 
it has fields for ID, Username, Email, and PasswordHash
it also has functions to hash passwords and check passwords using bcrypt
bycrypt is a popular library for hashing passwords securely
*/

package domain

import (
	"golang.org/x/crypto/bcrypt"
)

//make a user struct with fields: ID, Username, Email, PasswordHash
type User struct {
	ID           string `json:"id"`
	Username     string `json:"username"`
	Email        string `json:"email"`
	PasswordHash string `json:"-"`
}

//make a HashPassword(password string) (string, error) function using bcrypt
//this function takes a plain text password and returns the hashed version of it
func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	return string(bytes), err
}

//make a CheckPasswordHash(password, hash string) bool function using bcrypt
//this function takes a plain text password and a hashed password and returns true if they match
func CheckPasswordHash(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
} 
