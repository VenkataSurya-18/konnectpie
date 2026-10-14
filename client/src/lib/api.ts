
import axios from "axios";

export const api = axios.create({
  baseURL: "https://konnectpie.onrender.com/api",
  withCredentials: true,
});
