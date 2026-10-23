"use client";
import { useEffect } from "react";
export function PrintTrigger() { useEffect(() => { const timer = window.setTimeout(() => window.print(), 500); return () => window.clearTimeout(timer); }, []); return null; }
