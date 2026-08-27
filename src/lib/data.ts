// Backward-compat shim — new code should import from "@/lib/data/*" slices.
export { seedUsers, userById } from "./data/users";
export { lessons, quizzes, courses, quizByLesson, lessonById, courseById } from "./data/courses";
export { forumCategories, reportReasons, forumThreads, forumComments, categoryById } from "./data/forum";
export { projects, projectComments } from "./data/projects";
export { interests, LEVEL_LABEL, LEVEL_BADGE } from "./data/interests";
