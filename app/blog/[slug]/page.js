"use client";
import BlogPost from "@/static-pages/BlogPost";
import { useParams } from "next/navigation";

export default function Page() {
  const params = useParams();
  return <BlogPost match={{ params }} />;
}
