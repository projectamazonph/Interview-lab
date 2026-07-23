import { Metadata } from "next";
import { ContactContent } from "./ContactContent";

export const metadata: Metadata = {
  title: "Contact — Interview Lab",
  description: "Get in touch with the Interview Lab team.",
};

export default function ContactPage() {
  return <ContactContent />;
}
