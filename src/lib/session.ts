import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";

export async function getCurrentSession() {
  try {
    return await getServerSession(authOptions);
  } catch (error) {
    if (
      error instanceof Error &&
      (error.name === "JWEDecryptionFailed" ||
        error.message.includes("decryption operation failed"))
    ) {
      return null;
    }

    throw error;
  }
}
