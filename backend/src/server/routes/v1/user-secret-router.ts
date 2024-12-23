import { z } from "zod";

import { readLimit } from "@app/server/config/rateLimiter";
import { verifyAuth } from "@app/server/plugins/auth/verify-auth";
import { AuthMode } from "@app/services/auth/auth-type";
import { UserSecretType } from "@app/services/user-secret/user-secret-types";

// Data validation schemas
const WebLoginDataSchema = z.object({
  url: z.string().optional(),
  username: z.string(),
  password: z.string()
});

const CreditCardDataSchema = z.object({
  cardNumber: z.string(),
  expiryDate: z.string(),
  cvv: z.string()
});

const SecureNoteDataSchema = z.object({
  content: z.string()
});

// Request/Response schemas
const CreateUserSecretSchema = z.object({
  name: z.string(),
  type: z.nativeEnum(UserSecretType),
  data: z.discriminatedUnion("type", [
    z.object({ type: z.literal(UserSecretType.WEB_LOGIN), data: WebLoginDataSchema }),
    z.object({ type: z.literal(UserSecretType.CREDIT_CARD), data: CreditCardDataSchema }),
    z.object({ type: z.literal(UserSecretType.SECURE_NOTE), data: SecureNoteDataSchema })
  ])
});

const UpdateUserSecretSchema = z.object({
  name: z.string().optional(),
  data: z
    .discriminatedUnion("type", [
      z.object({ type: z.literal(UserSecretType.WEB_LOGIN), data: WebLoginDataSchema }),
      z.object({ type: z.literal(UserSecretType.CREDIT_CARD), data: CreditCardDataSchema }),
      z.object({ type: z.literal(UserSecretType.SECURE_NOTE), data: SecureNoteDataSchema })
    ])
    .optional()
});

export const registerUserSecretRouter = async (server: FastifyZodProvider) => {
  server.route({
    method: "GET",
    url: "/",
    config: {
      rateLimit: readLimit
    },
    schema: {
      querystring: z.object({
        offset: z.string().transform(Number).optional(),
        limit: z.string().transform(Number).optional()
      }),
      response: {
        200: z.object({
          secrets: z.array(
            z.object({
              id: z.string(),
              name: z.string(),
              type: z.nativeEnum(UserSecretType),
              data: z.union([WebLoginDataSchema, CreditCardDataSchema, SecureNoteDataSchema]),
              createdAt: z.string(),
              updatedAt: z.string(),
              createdBy: z.string()
            })
          ),
          totalCount: z.number()
        })
      }
    },
    onRequest: verifyAuth([AuthMode.JWT]),
    handler: async (req) => {
      const { offset, limit } = req.query;
      const { organizationId } = req.params as { organizationId: string };



      return server.services.userSecret.listUserSecrets({
        actor: req.permission.type,
        actorId: req.permission.id,
        actorAuthMethod: req.permission.authMethod,
        actorOrgId: req.permission.orgId,
        orgId: organizationId,
        offset,
        limit
      });
    }
  });

  server.route({
    method: "GET",
    url: "/:secretId",
    config: {
      rateLimit: readLimit
    },
    schema: {
      params: z.object({
        secretId: z.string()
      }),
      response: {
        200: z.object({
          id: z.string(),
          name: z.string(),
          type: z.nativeEnum(UserSecretType),
          data: z.union([WebLoginDataSchema, CreditCardDataSchema, SecureNoteDataSchema]),
          createdAt: z.string(),
          updatedAt: z.string(),
          createdBy: z.string()
        })
      }
    },
    onRequest: verifyAuth([AuthMode.JWT]),
    handler: async (req) => {
      const { organizationId, secretId } = req.params as { organizationId: string; secretId: string };

      return server.services.userSecret.getUserSecretById({
        actor: req.permission.type,
        actorId: req.permission.id,
        actorAuthMethod: req.permission.authMethod,
        actorOrgId: req.permission.orgId,
        orgId: organizationId,
        secretId
      });
    }
  });

  server.route({
    method: "POST",
    url: "/",
    schema: {
      body: CreateUserSecretSchema,
      response: {
        200: z.object({
          id: z.string(),
          name: z.string(),
          type: z.nativeEnum(UserSecretType),
          data: z.union([WebLoginDataSchema, CreditCardDataSchema, SecureNoteDataSchema]),
          createdAt: z.string(),
          updatedAt: z.string(),
          createdBy: z.string()
        })
      }
    },
    onRequest: verifyAuth([AuthMode.JWT]),
    handler: async (req) => {
      const { organizationId } = req.params as { organizationId: string };

      return server.services.userSecret.createUserSecret({
        actor: req.permission.type,
        actorId: req.permission.id,
        actorAuthMethod: req.permission.authMethod,
        actorOrgId: req.permission.orgId,
        orgId: organizationId,
        ...req.body
      });
    }
  });

  server.route({
    method: "PATCH",
    url: "/:secretId",
    schema: {
      params: z.object({
        secretId: z.string()
      }),
      body: UpdateUserSecretSchema,
      response: {
        200: z.object({
          id: z.string(),
          name: z.string(),
          type: z.nativeEnum(UserSecretType),
          data: z.union([WebLoginDataSchema, CreditCardDataSchema, SecureNoteDataSchema]),
          createdAt: z.string(),
          updatedAt: z.string(),
          createdBy: z.string()
        })
      }
    },
    onRequest: verifyAuth([AuthMode.JWT]),
    handler: async (req) => {
      const { organizationId, secretId } = req.params as { organizationId: string; secretId: string };

      return server.services.userSecret.updateUserSecret({
        actor: req.permission.type,
        actorId: req.permission.id,
        actorAuthMethod: req.permission.authMethod,
        actorOrgId: req.permission.orgId,
        orgId: organizationId,
        secretId,
        data: req.body
      });
    }
  });

  server.route({
    method: "DELETE",
    url: "/:secretId",
    schema: {
      params: z.object({
        secretId: z.string()
      }),
      response: {
        200: z.object({
          success: z.boolean()
        })
      }
    },
    onRequest: verifyAuth([AuthMode.JWT]),
    handler: async (req) => {
      const { organizationId, secretId } = req.params as { organizationId: string; secretId: string };

      await server.services.userSecret.deleteUserSecret({
        actor: req.permission.type,
        actorId: req.permission.id,
        actorAuthMethod: req.permission.authMethod,
        actorOrgId: req.permission.orgId,
        orgId: organizationId,
        secretId
      });

      return { success: true };
    }
  });
};