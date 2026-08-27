// Re-export all seed data — preserves existing import paths.
export { seedUsers, userById } from "./users";
export { lessons, quizzes, courses, quizByLesson, lessonById, courseById } from "./courses";
export { forumCategories, reportReasons, forumThreads, forumComments, categoryById } from "./forum";
export { projects, projectComments } from "./projects";
export { interests, LEVEL_LABEL, LEVEL_BADGE } from "./interests";
