import admin from "../Config/firebase.js";

const Auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    // Verify the token using Firebase Admin
    const decodedValue = await admin.auth().verifyIdToken(token);

    // Attach only UID to request
    req.user = decodedValue; // full token if you want email etc.
    req.userId = decodedValue.uid; // string only for MongoDB

    next();
  } catch (error) {
    console.error("Token verification failed:", error.message);
    res.status(401).json({ message: "Unauthorized" });
  }
};

export default { Auth };
