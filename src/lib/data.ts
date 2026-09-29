import { Contact, Message } from "./types"; 

export const contacts: Contact[] = [
  {
    id: 1,
    name: "James Wilson",
    phone: "+1 (555) 123-4567",
    lastMessage: "My AC isn't cooling properly",
    time: "10:42 AM",
    unread: 2,
    initials: "JW",
  },
  {
    id: 2,
    name: "Sarah Johnson",
    phone: "+1 (555) 234-5678",
    lastMessage: "Thank you for your help!",
    time: "9:35 AM",
    initials: "SJ",
  },
  {
    id: 3,
    name: "Michael Brown",
    phone: "+1 (555) 345-6789",
    lastMessage: "Can you come tomorrow?",
    time: "Yesterday",
    unread: 1,
    initials: "MB",
  },
  {
    id: 4,
    name: "Emily Davis",
    phone: "+1 (555) 456-7890",
    lastMessage: "The technician was great.",
    time: "Yesterday",
    initials: "ED",
  },
  {
    id: 5,
    name: "Robert Miller",
    phone: "+1 (555) 567-8901",
    lastMessage: "How much will the repair cost?",
    time: "Mon",
    initials: "RM",
  },
  {
    id: 6,
    name: "Jessica Taylor",
    phone: "+1 (555) 678-9012",
    lastMessage: "I'll be available after 3 PM.",
    time: "Mon",
    unread: 3,
    initials: "JT",
  },
];


export const conversations: Record<number, Message[]> = {
  2: [
    {
      id: "101",
      text: "Hi, I wanted to thank you for sending someone out yesterday.",
      sender: "customer",
      time: "9:30 AM",
    },
    {
      id: "102",
      text: "You're very welcome! We're glad we could help.",
      sender: "ai",
      time: "9:31 AM",
    },
    {
      id: "103",
      text: "Everything is working perfectly now.",
      sender: "customer",
      time: "9:34 AM",
    },
    {
      id: "104",
      text: "That's great to hear. Have a wonderful day!",
      sender: "ai",
      time: "9:35 AM",
    },
  ],

  3: [
    {
      id: "201",
      text: "Can you come tomorrow to check my furnace?",
      sender: "customer",
      time: "Yesterday",
    },
    {
      id: "202",
      text: "Absolutely. We have a few appointment windows available tomorrow.",
      sender: "ai",
      time: "Yesterday",
    },
    {
      id: "203",
      text: "Morning would work best for me.",
      sender: "customer",
      time: "Yesterday",
    },
  ],

  4: [
    {
      id: "301",
      text: "The technician was great. Very professional.",
      sender: "customer",
      time: "Yesterday",
    },
    {
      id: "302",
      text: "Thank you for the feedback! We'll make sure the team hears that.",
      sender: "ai",
      time: "Yesterday",
    },
  ],

  5: [
    {
      id: "401",
      text: "How much will the repair cost?",
      sender: "customer",
      time: "Mon",
    },
    {
      id: "402",
      text: "The exact price depends on what our technician finds during the inspection.",
      sender: "ai",
      time: "Mon",
    },
    {
      id: "403",
      text: "Okay, that makes sense.",
      sender: "customer",
      time: "Mon",
    },
  ],

  6: [
    {
      id: "501",
      text: "I'll be available after 3 PM.",
      sender: "customer",
      time: "Mon",
    },
    {
      id: "502",
      text: "Perfect. We'll keep that availability in mind when scheduling your appointment.",
      sender: "ai",
      time: "Mon",
    },
  ],
};

export const leadSources = [
  {
    id: "website",
    name: "Website",
    description: "Lead submitted through your website",
    icon: "🌐",
  },
  {
    id: "google-ads",
    name: "Google Ads",
    description: "Lead generated from a Google ad",
    icon: "🔎",
  },
  {
    id: "facebook",
    name: "Facebook",
    description: "Lead generated from Facebook",
    icon: "📘",
  },
  {
    id: "instagram",
    name: "Instagram",
    description: "Lead generated from Instagram",
    icon: "📸",
  },
  {
    id: "yelp",
    name: "Yelp",
    description: "Lead generated from Yelp",
    icon: "⭐",
  },
  {
    id: "google-business",
    name: "Google Business",
    description: "Lead from Google Business Profile",
    icon: "📍",
  },
  {
    id: "thumbtack",
    name: "Thumbtack",
    description: "Lead generated from Thumbtack",
    icon: "🔨",
  },
  {
    id: "homeadvisor",
    name: "HomeAdvisor",
    description: "Lead generated from HomeAdvisor",
    icon: "🏠",
  },
  {
    id: "angi",
    name: "Angi",
    description: "Lead generated from Angi",
    icon: "🛠️",
  },
  {
    id: "manual",
    name: "Manual / Phone",
    description: "Lead manually entered by staff",
    icon: "📞",
  },
];