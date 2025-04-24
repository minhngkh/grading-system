package token

import (
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"os"
	"sync"
	"time"

	"github.com/go-jose/go-jose/v4/jwt"
)

type AuthInfo struct {
	UserID      int32 `json:"user_id"`
	IsActivated bool  `json:"is_activated"`
}

type RefreshInfo = AuthInfo

var (
	signingKey    = []byte(os.Getenv("SIGNING_KEY"))
	encryptionKey = []byte(os.Getenv("ENCRYPTION_KEY"))
)

const (
	accessTokenDuration      = time.Minute * 15
	refreshtokenDuration     = time.Hour * 24 * 7
	oauth2StateTokenDuration = time.Minute * 15
)

func GenerateRandomToken(length int) (string, error) {
	bytes := make([]byte, length)
	_, err := rand.Read(bytes)
	if err != nil {
		return "", err
	}

	return hex.EncodeToString(bytes), nil
}

func HashToken(token string) string {
	h := hmac.New(sha256.New, signingKey)
	h.Write([]byte(token))
	return hex.EncodeToString(h.Sum(nil))
}

func VerifyHash(token, hash string) bool {
	expectedHash := HashToken(token)
	return hmac.Equal([]byte(expectedHash), []byte(hash))
}

// Creates an access token
func CreateAccessToken(payload AuthInfo) (JwtToken, error) {
	curTime := time.Now()

	token, err := SignJwtToken(
		signingKey,
		JwtRegisteredClaims{
			IssuedAt: jwt.NewNumericDate(curTime),
			Expiry:   jwt.NewNumericDate(curTime.Add(accessTokenDuration)),
		},
		payload,
	)
	if err != nil {
		return JwtToken{}, err
	}

	return token, nil
}

// Creates a refresh token
func CreateRefreshToken(payload RefreshInfo) (JwtToken, error) {
	curTime := time.Now()

	token, err := SignJwtToken(
		signingKey,
		JwtRegisteredClaims{
			IssuedAt: jwt.NewNumericDate(curTime),
			Expiry:   jwt.NewNumericDate(curTime.Add(refreshtokenDuration)),
		},
		payload,
	)
	if err != nil {
		return JwtToken{}, err
	}

	return token, nil
}

func CreateAuthTokens(authInfo AuthInfo) (accessToken JwtToken, refreshToken JwtToken, err error) {
	var accessErr, refreshErr error
	var wg sync.WaitGroup
	wg.Add(2)

	go func() {
		defer wg.Done()
		accessToken, accessErr = CreateAccessToken(authInfo)
	}()

	go func() {
		defer wg.Done()
		refreshToken, refreshErr = CreateRefreshToken(authInfo)
	}()

	wg.Wait()

	if accessErr != nil {
		return JwtToken{}, JwtToken{}, accessErr
	}
	if refreshErr != nil {
		return JwtToken{}, JwtToken{}, refreshErr
	}

	return accessToken, refreshToken, nil
}

// Validates access token.
// Returns the auth info and registered claims.
func ValidateAccessToken(token string) (AuthInfo, JwtRegisteredClaims, error) {
	var authInfo AuthInfo
	regClaims, err := ValidateSignedJwtToken(signingKey, token, &authInfo)
	if err != nil {
		return AuthInfo{}, JwtRegisteredClaims{}, err
	}

	return authInfo, regClaims, nil
}

// Validates refrsh token.
// Returns the registered claims.
func ValidateRefreshToken(token string) (RefreshInfo, JwtRegisteredClaims, error) {
	var refreshInfo RefreshInfo
	regClaims, err := ValidateSignedJwtToken(signingKey, token, &refreshInfo)
	if err != nil {
		return RefreshInfo{}, JwtRegisteredClaims{}, err
	}

	return refreshInfo, regClaims, nil
}

type RequestApplication struct {
	Host string `json:"request_host,omitempty"`
}

type StateToken struct {
	RequestApplication
	AuthProvider string `json:"auth_provider"`
}

func CreateOauth2StateToken(app RequestApplication, provider string) (JwtToken, error) {
	curTime := time.Now()

	token, err := EncryptJwtToken(
		encryptionKey,
		JwtRegisteredClaims{
			Expiry:   jwt.NewNumericDate(curTime.Add(oauth2StateTokenDuration)),
			IssuedAt: jwt.NewNumericDate(curTime),
		},
		StateToken{
			RequestApplication: app,
			AuthProvider:       provider,
		},
	)
	if err != nil {
		return JwtToken{}, err
	}

	return token, nil
}

var (
	ErrInvalidStateToken  = errors.New("invalid state token")
	ErrMismatchedProvider = errors.New("mismatched provider")
)

func ValidateOauth2StateToken(token string, provider string) (RequestApplication, error) {
	var stateToken StateToken
	_, err := ValidateEncryptedJwtToken(encryptionKey, token, &stateToken)
	if err != nil {
		return RequestApplication{}, ErrInvalidStateToken
	}

	if stateToken.AuthProvider != provider {
		return RequestApplication{}, ErrMismatchedProvider
	}

	return stateToken.RequestApplication, nil
}
