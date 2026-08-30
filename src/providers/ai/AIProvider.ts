import type {
  AIAssessment,
  AIAssessmentInput,
} from "./AIAssessment";

export interface AIProvider {
  assessApplication(
    input: AIAssessmentInput
  ): Promise<AIAssessment>;
}