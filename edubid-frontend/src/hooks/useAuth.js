import { use } from "react";
import { AuthContext } from "../context/AuthProvider";

export const useAuth = () => use(AuthContext);
