import axios from "axios";

export const api = axios.create({
  baseURL: "https://flow-fhcc.onrender.com",
  withCredentials: true,
});

export const api3 = axios.create({
  baseURL: "https://bot-2-s61t.onrender.com",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json"
  }
});

// http://localhost:6000
//https://flow-fhcc.onrender.com