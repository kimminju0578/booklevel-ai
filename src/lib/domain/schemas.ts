import { z } from "zod";

export const uuid = z.string().uuid();
export const categorySlug = z.enum(["economics","philosophy","psychology","society","history","literature","science","ai-tech"]);
export const practiceType = z.enum(["book_based","topic_based","weakness_training","random","timed_exam"]);
export const skill = z.enum(["understanding","thesis","reasoning","evidence","counterargument","structure","expression"]);
export const rubricMax = { understanding:15, thesis:15, reasoning:20, evidence:15, counterargument:15, structure:10, expression:10 } as const;
export const rubricLabels = { understanding:"논제 이해", thesis:"주장 명확성", reasoning:"논거 타당성", evidence:"근거 활용", counterargument:"반론·재반론", structure:"구조·일관성", expression:"표현력" } as const;
export const scoresSchema = z.object({understanding:z.number().int().min(0).max(15),thesis:z.number().int().min(0).max(15),reasoning:z.number().int().min(0).max(20),evidence:z.number().int().min(0).max(15),counterargument:z.number().int().min(0).max(15),structure:z.number().int().min(0).max(10),expression:z.number().int().min(0).max(10),total:z.number().int().min(0).max(100)});
export const evaluationOutput = z.object({scores:scoresSchema,strengths:z.array(z.string().max(1000)).min(1).max(5),weaknesses:z.array(z.string().max(1000)).min(1).max(5),rewrite_goal:z.string().max(2000),guiding_question:z.string().max(1000)});
export const evaluationSchema = evaluationOutput.refine(v=>Object.keys(rubricMax).reduce((sum,k)=>sum+v.scores[k as keyof typeof rubricMax],0)===v.scores.total,{message:"평가 점수 합계가 일치하지 않습니다."});
export const reasonSchema = z.object({reason:z.string().min(1).max(1200),next_learning_focus:z.array(z.string().max(200)).max(3)});
export const questionSchema = z.object({question:z.string().min(10).max(2000),goal:z.string().max(500),evaluation_focus:z.array(z.string().max(100)).max(7)});
export const discussionSchema = z.object({title:z.string().min(1).max(160),question:z.string().min(10).max(2000),suggested_angles:z.array(z.string().max(300)).max(3)});

export const bookRow = z.object({id:uuid,isbn10:z.string().nullable(),isbn13:z.string().nullable(),title:z.string(),subtitle:z.string().nullable(),authors:z.array(z.string()),publisher:z.string().nullable(),published_date:z.string().nullable(),description:z.string().nullable(),cover_url:z.string().nullable(),language:z.string().nullable(),page_count:z.number().nullable(),difficulty_level:z.number().nullable(),metadata_quality:z.string(),source_provider:z.string().nullable(),source_id:z.string().nullable(),is_active:z.boolean()});
export type BookRow = z.infer<typeof bookRow>;
export const pageSchema = z.coerce.number().int().min(1).max(100).default(1);
export const contentSchema = z.string().trim().min(1).max(5000);
export const reviewInput = z.object({rating:z.number().int().min(1).max(5),shortReview:z.string().max(140).default(""),content:contentSchema,perceivedDifficulty:z.enum(["easy","suitable","hard"]).optional(),recommendedFor:z.string().max(300).default(""),containsSpoiler:z.boolean().default(false)}).strict();
export const essayStartInput = z.object({questionId:uuid,mode:z.enum(["practice","timed"]),timeLimitSeconds:z.union([z.literal(600),z.literal(1200),z.literal(1800)]).nullable()}).strict().refine(v=>v.mode==='practice'?v.timeLimitSeconds===null:v.timeLimitSeconds!==null);
export const draftInput = z.object({attemptId:uuid,content:z.string().max(10000),revision:z.number().int().min(0)}).strict();
export const submittedDraftInput = z.object({content:z.string().trim().min(20,"답안은 20자 이상 작성해주세요.").max(10000),revision:z.number().int().min(0)}).strict();
export const generateQuestionInput = z.object({bookId:uuid.optional(),categoryId:uuid.optional(),difficulty:z.number().int().min(1).max(5),practiceType:practiceType,targetSkill:skill.optional()}).strict().refine(v=>v.practiceType!=='book_based'||!!v.bookId,{message:'책을 선택해주세요.'});
