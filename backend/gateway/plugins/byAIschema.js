// Schema validation definitions for different API endpoints
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

// Initialize AJV with formats support
const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

// Authentication schemas
const authSchemas = {
  login: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: {
        type: 'string',
        format: 'email',
        maxLength: 255
      },
      password: {
        type: 'string',
        minLength: 6,
        maxLength: 128
      }
    },
    additionalProperties: false
  },

  register: {
    type: 'object',
    required: ['username', 'email', 'password'],
    properties: {
      username: {
        type: 'string',
        minLength: 3,
        maxLength: 50,
        pattern: '^[a-zA-Z0-9_-]+$'
      },
      email: {
        type: 'string',
        format: 'email',
        maxLength: 255
      },
      password: {
        type: 'string',
        minLength: 6,
        maxLength: 128
      },
      confirmPassword: {
        type: 'string',
        minLength: 6,
        maxLength: 128
      }
    },
    additionalProperties: false
  },

  forgotPassword: {
    type: 'object',
    required: ['email'],
    properties: {
      email: {
        type: 'string',
        format: 'email',
        maxLength: 255
      }
    },
    additionalProperties: false
  },

  resetPassword: {
    type: 'object',
    required: ['token', 'password'],
    properties: {
      token: {
        type: 'string',
        minLength: 1
      },
      password: {
        type: 'string',
        minLength: 6,
        maxLength: 128
      }
    },
    additionalProperties: false
  },

  verifyEmail: {
    type: 'object',
    required: ['token'],
    properties: {
      token: {
        type: 'string',
        minLength: 1
      }
    },
    additionalProperties: false
  }
};

// User management schemas
const userSchemas = {
  updateProfile: {
    type: 'object',
    properties: {
      username: {
        type: 'string',
        minLength: 3,
        maxLength: 50,
        pattern: '^[a-zA-Z0-9_-]+$'
      },
      email: {
        type: 'string',
        format: 'email',
        maxLength: 255
      },
      firstName: {
        type: 'string',
        maxLength: 100
      },
      lastName: {
        type: 'string',
        maxLength: 100
      }
    },
    additionalProperties: false
  },

  changePassword: {
    type: 'object',
    required: ['currentPassword', 'newPassword'],
    properties: {
      currentPassword: {
        type: 'string',
        minLength: 6,
        maxLength: 128
      },
      newPassword: {
        type: 'string',
        minLength: 6,
        maxLength: 128
      }
    },
    additionalProperties: false
  }
};

// Game related schemas
const gameSchemas = {
  createGame: {
    type: 'object',
    required: ['gameType'],
    properties: {
      gameType: {
        type: 'string',
        enum: ['pong', 'tournament']
      },
      playerCount: {
        type: 'integer',
        minimum: 2,
        maximum: 4
      },
      settings: {
        type: 'object',
        properties: {
          difficulty: {
            type: 'string',
            enum: ['easy', 'medium', 'hard']
          },
          speed: {
            type: 'number',
            minimum: 1,
            maximum: 10
          }
        }
      }
    },
    additionalProperties: false
  },

  joinGame: {
    type: 'object',
    required: ['gameId'],
    properties: {
      gameId: {
        type: 'string',
        minLength: 1
      }
    },
    additionalProperties: false
  }
};

// Chat schemas
const chatSchemas = {
  sendMessage: {
    type: 'object',
    required: ['message'],
    properties: {
      message: {
        type: 'string',
        minLength: 1,
        maxLength: 1000
      },
      roomId: {
        type: 'string',
        minLength: 1
      }
    },
    additionalProperties: false
  },

  createRoom: {
    type: 'object',
    required: ['name'],
    properties: {
      name: {
        type: 'string',
        minLength: 1,
        maxLength: 100
      },
      isPrivate: {
        type: 'boolean',
        default: false
      }
    },
    additionalProperties: false
  }
};

// Admin schemas
const adminSchemas = {
  banUser: {
    type: 'object',
    required: ['userId'],
    properties: {
      userId: {
        type: 'string',
        minLength: 1
      },
      reason: {
        type: 'string',
        maxLength: 500
      },
      duration: {
        type: 'integer',
        minimum: 1
      }
    },
    additionalProperties: false
  },

  updateUserRole: {
    type: 'object',
    required: ['userId', 'role'],
    properties: {
      userId: {
        type: 'string',
        minLength: 1
      },
      role: {
        type: 'string',
        enum: ['user', 'admin', 'moderator']
      }
    },
    additionalProperties: false
  }
};

// Compile all schemas
const compiledSchemas = {};

// Compile auth schemas
Object.keys(authSchemas).forEach(key => {
  compiledSchemas[`auth_${key}`] = ajv.compile(authSchemas[key]);
});

// Compile user schemas
Object.keys(userSchemas).forEach(key => {
  compiledSchemas[`user_${key}`] = ajv.compile(userSchemas[key]);
});

// Compile game schemas
Object.keys(gameSchemas).forEach(key => {
  compiledSchemas[`game_${key}`] = ajv.compile(gameSchemas[key]);
});

// Compile chat schemas
Object.keys(chatSchemas).forEach(key => {
  compiledSchemas[`chat_${key}`] = ajv.compile(chatSchemas[key]);
});

// Compile admin schemas
Object.keys(adminSchemas).forEach(key => {
  compiledSchemas[`admin_${key}`] = ajv.compile(adminSchemas[key]);
});

// Route to schema mapping based on nginx proxy configuration
const routeSchemaMap = {
  // Auth routes (public)
  'POST:/auth/login': 'auth_login',
  'POST:/auth/register': 'auth_register',
  'POST:/auth/forgot-password': 'auth_forgotPassword',
  'POST:/auth/reset-password': 'auth_resetPassword',
  'POST:/auth/verify-email': 'auth_verifyEmail',
  
  // User routes (protected)
  'PUT:/user/profile': 'user_updateProfile',
  'POST:/user/change-password': 'user_changePassword',
  
  // Game routes (protected)
  'POST:/game/create': 'game_createGame',
  'POST:/game/join': 'game_joinGame',
  
  // Chat routes (protected)
  'POST:/chat/message': 'chat_sendMessage',
  'POST:/chat/room': 'chat_createRoom',
  
  // Admin routes (admin only)
  'POST:/admin/ban-user': 'admin_banUser',
  'PUT:/admin/user-role': 'admin_updateUserRole'
};

// Validation function
export function validateRequest(method, path, body) {
  const routeKey = `${method}:${path}`;
  const schemaName = routeSchemaMap[routeKey];
  
  if (!schemaName) {
    // No schema defined for this route
    return { valid: true };
  }
  
  const validator = compiledSchemas[schemaName];
  if (!validator) {
    throw new Error(`Schema ${schemaName} not found`);
  }
  
  const valid = validator(body);
  
  if (!valid) {
    return {
      valid: false,
      errors: validator.errors.map(error => ({
        field: error.instancePath || error.schemaPath,
        message: error.message,
        value: error.data
      }))
    };
  }
  
  return { valid: true };
}

// Export all schemas for reference
export {
  authSchemas,
  userSchemas,
  gameSchemas,
  chatSchemas,
  adminSchemas,
  routeSchemaMap,
  compiledSchemas
};

export default {
  validateRequest,
  authSchemas,
  userSchemas,
  gameSchemas,
  chatSchemas,
  adminSchemas,
  routeSchemaMap
};