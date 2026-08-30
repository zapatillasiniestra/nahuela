import {
  IdentityProvider,
  MockIdentityProvider,
  SumsubProvider
} from "./identity";

import {
  AIProvider,
  MockAIProvider
} from "./ai";

import { DocumentProvider } from "./document/DocumentProvider";
import MockDocumentProvider from "./document/MockDocumentProvider";

export function createIdentityProvider(): IdentityProvider {
  switch (process.env.IDENTITY_PROVIDER) {

    case "mock":
    default:
      return new MockIdentityProvider();

    case "sumsub":
      return new SumsubProvider();

  }

}

export function createAIProvider(): AIProvider {
  switch (process.env.AI_PROVIDER) {

    case "mock":
    default:
      return new MockAIProvider();

  }

}

export function createDocumentProvider(): DocumentProvider {
  switch (process.env.DOCUMENT_PROVIDER) {

    case "mock":
    default:
      return new MockDocumentProvider();

  }

}