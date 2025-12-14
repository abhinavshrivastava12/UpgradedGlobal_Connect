import mongoose from 'mongoose';
import User from '../models/user.model.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const fakeUsers = [
  {
    firstName: "Elon",
    lastName: "Musk",
    userName: "elonmusk",
    email: "elon@tesla.com",
    profileImage: "https://randomuser.me/api/portraits/men/1.jpg",
    headline: "CEO at Tesla & SpaceX | Innovating the Future",
    location: "California, USA",
    skills: ["Leadership", "Innovation", "Electric Vehicles", "Space Technology"],
    education: [{
      college: "University of Pennsylvania",
      degree: "Bachelor of Science",
      fieldOfStudy: "Physics",
      startYear: 1992,
      endYear: 1997
    }],
    experience: [{
      title: "CEO",
      company: "Tesla Inc.",
      location: "Palo Alto, CA",
      description: "Leading electric vehicle revolution"
    }],
    connection: []
  },
  {
    firstName: "Satya",
    lastName: "Nadella",
    userName: "satyanadella",
    email: "satya@microsoft.com",
    profileImage: "https://randomuser.me/api/portraits/men/2.jpg",
    headline: "CEO at Microsoft | Cloud Computing Pioneer",
    location: "Washington, USA",
    skills: ["Cloud Computing", "AI", "Leadership", "Strategic Planning"],
    education: [{
      college: "University of Wisconsin",
      degree: "Master's",
      fieldOfStudy: "Computer Science",
      startYear: 1988,
      endYear: 1990
    }],
    experience: [{
      title: "CEO",
      company: "Microsoft",
      location: "Redmond, WA",
      description: "Cloud transformation"
    }],
    connection: []
  },
  {
    firstName: "Sundar",
    lastName: "Pichai",
    userName: "sundarpichai",
    email: "sundar@google.com",
    profileImage: "https://randomuser.me/api/portraits/men/3.jpg",
    headline: "CEO at Google & Alphabet | AI Visionary",
    location: "California, USA",
    skills: ["Product Management", "AI", "Search Technology", "Leadership"],
    education: [{
      college: "Stanford University",
      degree: "MBA",
      fieldOfStudy: "Business",
      startYear: 2000,
      endYear: 2002
    }],
    experience: [{
      title: "CEO",
      company: "Google",
      location: "Mountain View, CA",
      description: "AI transformation"
    }],
    connection: []
  },
  {
    firstName: "Tim",
    lastName: "Cook",
    userName: "timcook",
    email: "tim@apple.com",
    profileImage: "https://randomuser.me/api/portraits/men/4.jpg",
    headline: "CEO at Apple | Supply Chain Expert",
    location: "California, USA",
    skills: ["Supply Chain", "Operations", "Leadership", "Product Design"],
    education: [{
      college: "Duke University",
      degree: "MBA",
      fieldOfStudy: "Business",
      startYear: 1986,
      endYear: 1988
    }],
    experience: [{
      title: "CEO",
      company: "Apple Inc.",
      location: "Cupertino, CA",
      description: "Innovation leadership"
    }],
    connection: []
  },
  {
    firstName: "Ginni",
    lastName: "Rometty",
    userName: "ginnirometty",
    email: "ginni@ibm.com",
    profileImage: "https://randomuser.me/api/portraits/women/2.jpg",
    headline: "Former CEO at IBM | Tech Pioneer",
    location: "New York, USA",
    skills: ["Enterprise Tech", "AI", "Cloud", "Leadership"],
    education: [{
      college: "Northwestern University",
      degree: "Bachelor's",
      fieldOfStudy: "Computer Science",
      startYear: 1975,
      endYear: 1979
    }],
    experience: [{
      title: "CEO",
      company: "IBM",
      location: "Armonk, NY",
      description: "Cognitive solutions"
    }],
    connection: []
  }
];

const insertUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("✅ Connected to MongoDB");

    const hashedPassword = await bcrypt.hash("Password@123", 10);
    const usersToInsert = fakeUsers.map(user => ({
      ...user,
      password: hashedPassword,
      isEmailVerified: true
    }));

    await User.insertMany(usersToInsert);
    console.log("✅ Fake users inserted!");
    console.log("📧 Login with: elon@tesla.com / Password@123");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

insertUsers();