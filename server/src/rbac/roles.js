const ROLES = {
  USER: {
    name: "USER",
    description: "Basic registered user (student)",
    inherits: [],
  },

  DONOR: {
    name: "DONOR",
    description:
      "Verified donor who can fund campaigns and create donor projects",
    inherits: ["USER"],
  },

  ALUMNI: {
    name: "ALUMNI",
    description: "Graduated donor with extended platform privileges",
    inherits: ["DONOR"], // inherits all DONOR grants → which inherits USER
  },

  MENTOR: {
    name: "MENTOR",
    description: "Approved mentor who can manage mentorship sessions",
    inherits: [], // standalone — no inheritance chain
  },

  STUDENT_PRESIDENT: {
    name: "STUDENT_PRESIDENT",
    description: "Club president with campaign and club management rights",
    inherits: ["USER"],
  },

  ADMIN: {
    name: "ADMIN",
    description: "Platform administrator with full access",
    inherits: [], // standalone — has all grants explicitly
  },
};

module.exports = { ROLES };
