"use client";

import { toast } from '@/hooks/use-toast';

// Browser-based LLM integration that works without API keys
// Uses local LLM fallback and rule-based system for Amazon VA career guidance

// Extend Window type to support the experimental window.ai API
declare global {
  interface Window {
    ai?: {
      models?: {
        available(): Promise<{ name: string }[]>;
      };
      generateText?(model: { name: string }, options: { prompt: string; max_tokens?: number; temperature?: number }): Promise<string>;
    };
  }
}

interface LLMResponse {
  score?: number;
  missingKeywords?: string[];
  weakSections?: string[];
  improvedSummary?: string;
  improvedBullets?: string[];
  skillsRecommendations?: string[];
  truthWarnings?: string[];
  improvedVersion?: string;
  draftLetter?: string;
  shorterVersion?: string;
  subjectLine?: string;
  customizationTips?: string[];
  claimsToVerify?: string[];
  correctDecisions?: string[];
  incorrectDecisions?: string[];
  missedOpportunities?: string[];
  recommendedNextStep?: string;
  modelAnswer?: string;
}

class BrowserLLMIntegration {
  private static instance: BrowserLLMIntegration;
  private conversationHistory: { role: 'system' | 'user' | 'assistant'; content: string }[] = [];
  
  private constructor() {
    this.initializeSystemPrompt();
  }
  
  public static getInstance(): BrowserLLMIntegration {
    if (!BrowserLLMIntegration.instance) {
      BrowserLLMIntegration.instance = new BrowserLLMIntegration();
    }
    return BrowserLLMIntegration.instance;
  }
  
  private initializeSystemPrompt() {
    this.conversationHistory = [
      {
        role: 'system',
        content: `You are an Amazon VA career preparation assistant. Your job is to help users prepare for Amazon marketplace virtual assistant roles, especially Amazon PPC, Seller Central support, listing support, reporting, and agency operations roles. You must be practical, honest, and role-specific. Help users explain their real skills clearly without exaggerating or fabricating experience. Never guarantee job placement, interview success, ranking results, ACoS improvement, or Amazon account outcomes.`
      }
    ];
  }
  
  private isLocalAvailable(): boolean {
    // Check if we're in a browser environment
    return typeof window !== 'undefined' && typeof window.ai !== 'undefined';
  }
  
  public async generateResponse(
    prompt: string,
    responseType: 'resume' | 'assessment' | 'cover-letter'
  ): Promise<LLMResponse> {
    try {
      // First try local browser AI if available
      if (this.isLocalAvailable()) {
        try {
          const response = await this.callLocalAI(prompt);
          if (response) {
            return this.parseResponse(response, responseType);
          }
        } catch (error) {
          console.warn('Local AI not available, falling back to rule-based system:', error);
        }
      }
      
      // Fall back to rule-based system
      return this.ruleBasedResponse(prompt, responseType);
      
    } catch (error) {
      console.error('LLM integration error:', error);
      toast({
        title: "AI Service Temporarily Unavailable",
        description: "Using enhanced rule-based system for your request.",
        variant: "default",
      });
      return this.ruleBasedResponse(prompt, responseType);
    }
  }
  
  private async callLocalAI(prompt: string): Promise<string | null> {
    // Try to use browser AI API if available
    if (typeof window !== 'undefined' && window.ai?.models?.available()) {
      const availableModels = await window.ai.models.available();
      if (availableModels.length > 0) {
        const model = availableModels[0];
        const response = await window.ai.generateText(model, {
          prompt: `${this.getConversationContext()}\n\nUser Request: ${prompt}`,
          max_tokens: 1000,
          temperature: 0.3,
        });
        return response.text;
      }
    }
    return null;
  }
  
  private getConversationContext(): string {
    return this.conversationHistory
      .slice(1) // Exclude system prompt
      .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n\n');
  }
  
  private parseResponse(response: string, responseType: string): LLMResponse {
    try {
      // Try to parse JSON response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed;
      }
      
      // If no valid JSON, create structured response based on responseType
      return this.fallbackResponse(response, responseType);
      
    } catch (error) {
      return this.fallbackResponse(response, responseType);
    }
  }
  
  private ruleBasedResponse(prompt: string, responseType: string): LLMResponse {
    const lowerPrompt = prompt.toLowerCase();
    
    switch (responseType) {
      case 'resume':
        return this.generateResumeResponse(lowerPrompt);
      case 'assessment':
        return this.generateAssessmentResponse(lowerPrompt);
      case 'cover-letter':
        return this.generateCoverLetterResponse(lowerPrompt);
      default:
        return this.generateGenericResponse(lowerPrompt);
    }
  }
  
  private generateResumeResponse(prompt: string): LLMResponse {
    const score = this.calculateResumeScore(prompt);
    const missingKeywords = this.extractMissingKeywords(prompt);
    const weakSections = this.extractWeakSections(prompt);
    
    return {
      score,
      missingKeywords,
      weakSections,
      improvedSummary: this.generateImprovedSummary(prompt),
      improvedBullets: this.generateImprovedBullets(prompt),
      skillsRecommendations: this.generateSkillsRecommendations(prompt),
      truthWarnings: this.generateTruthWarnings(prompt),
      improvedVersion: this.generateImprovedVersion(prompt),
    };
  }
  
  private generateAssessmentResponse(prompt: string): LLMResponse {
    const score = this.calculateAssessmentScore(prompt);
    const correctDecisions = this.extractCorrectDecisions(prompt);
    const incorrectDecisions = this.extractIncorrectDecisions(prompt);
    
    return {
      score,
      correctDecisions,
      incorrectDecisions,
      missedOpportunities: this.generateMissedOpportunities(prompt),
      recommendedNextStep: this.generateRecommendedNextStep(prompt),
      modelAnswer: this.generateModelAnswer(prompt),
    };
  }
  
  private generateCoverLetterResponse(prompt: string): LLMResponse {
    return {
      draftLetter: this.generateCoverLetterDraft(prompt),
      shorterVersion: this.generateShorterVersion(prompt),
      subjectLine: this.generateSubjectLine(prompt),
      customizationTips: this.generateCustomizationTips(prompt),
      claimsToVerify: this.generateClaimsToVerify(prompt),
    };
  }
  
  private calculateResumeScore(prompt: string): number {
    if (prompt.includes('amazon') && prompt.includes('ppc') && prompt.includes('seller')) {
      return 85;
    } else if (prompt.includes('amazon') && prompt.includes('experience')) {
      return 70;
    }
    return 40;
  }
  
  private extractMissingKeywords(prompt: string): string[] {
    const keywords = ['Seller Central', 'PPC reporting', 'ACoS', 'ROAS', 'search term reports'];
    const foundKeywords = keywords.filter(keyword => 
      prompt.includes(keyword.toLowerCase())
    );
    return keywords.filter(keyword => !foundKeywords.includes(keyword));
  }
  
  private extractWeakSections(prompt: string): string[] {
    const sections: string[] = [];
    if (!prompt.includes('metrics') && !prompt.includes('results')) sections.push('Metrics and outcomes');
    if (!prompt.includes('ammazon') && !prompt.includes('va')) sections.push('Professional Summary');
    if (!prompt.includes('campaigns') && !prompt.includes('structure')) sections.push('Campaign Structure');
    return sections.slice(0, 2);
  }
  
  // Helper methods for generating responses
  private generateImprovedSummary(prompt: string): string {
    return 'Detail-oriented Virtual Assistant with training in Amazon Seller Central support, PPC reporting, keyword research workflows, and client communication. Familiar with Amazon PPC metrics including ACoS, ROAS, CTR, CPC, and CVR.';
  }
  
  private generateImprovedBullets(prompt: string): string[] {
    return [
      'Reviewed Amazon PPC search term reports and flagged high-click, zero-sale terms for negative keyword review',
      'Prepared weekly PPC performance summaries using spend, sales, ACoS, ROAS, and conversion data'
    ];
  }
  
  private generateSkillsRecommendations(prompt: string): string[] {
    return ['Amazon Seller Central', 'Amazon Ads Console', 'PPC Reporting', 'Keyword Research', 'Search Term Report Analysis'];
  }
  
  private generateTruthWarnings(prompt: string): string[] {
    return [];
  }
  
  private generateImprovedVersion(prompt: string): string {
    return prompt;
  }
  
  private calculateAssessmentScore(prompt: string): number {
    if (prompt.includes('metrics') && prompt.includes('action') && prompt.includes('data')) {
      return 85;
    } else if (prompt.includes('data') && prompt.includes('risk')) {
      return 70;
    }
    return 50;
  }
  
  private extractCorrectDecisions(prompt: string): string[] {
    return ['You attempted the exercise'];
  }
  
  private extractIncorrectDecisions(prompt: string): string[] {
    return [];
  }
  
  private generateMissedOpportunities(prompt: string): string[] {
    return ['Try to include more specific metrics and reasoning'];
  }
  
  private generateRecommendedNextStep(prompt: string): string {
    return 'Review the relevant guide and try again';
  }
  
  private generateModelAnswer(prompt: string): string {
    return 'Please review the assessment data and provide detailed analysis with specific metrics and action recommendations.';
  }
  
  private generateCoverLetterDraft(prompt: string): string {
    const roleMatch = prompt.match(/role:\s*(.*?)(?:\n|$)/i);
    const targetRole = roleMatch ? roleMatch[1] : 'Amazon VA';
    
    return `Dear Hiring Manager,

I am applying for the ${targetRole} role. I have a strong interest in Amazon marketplace operations and have been training in PPC workflows, search term report review, campaign organization, keyword research, and performance reporting.

I understand the importance of tracking key metrics such as spend, sales, ACoS, ROAS, CTR, CPC, orders, and conversion rate. I can support a team by preparing reports, reviewing search terms, flagging high-click zero-sale keywords, documenting optimization actions, and following campaign naming and QA checklists carefully.

I am comfortable working with SOPs, Google Sheets, ClickUp, and Amazon-related tools. I value accuracy, clear communication, and consistent documentation.

Thank you for considering my application.

Sincerely,
[Your Name]`;
  }
  
  private generateShorterVersion(prompt: string): string {
    const roleMatch = prompt.match(/role:\s*(.*?)(?:\n|$)/i);
    const targetRole = roleMatch ? roleMatch[1] : 'Amazon VA';
    
    return `Hi, I am applying for the ${targetRole} role. I have trained in Amazon PPC workflows, search term reports, and client communication. I can support your team with organized reporting, keyword analysis, and SOP-driven task execution.`;
  }
  
  private generateSubjectLine(prompt: string): string {
    const roleMatch = prompt.match(/role:\s*(.*?)(?:\n|$)/i);
    const targetRole = roleMatch ? roleMatch[1] : 'Amazon VA';
    
    return `Application for ${targetRole} Position`;
  }
  
  private generateCustomizationTips(prompt: string): string[] {
    return ['Add specific tool experience if you have it', 'Mention any relevant training or certifications'];
  }
  
  private generateClaimsToVerify(prompt: string): string[] {
    return ['Verify any tool familiarity mentioned'];
  }
  
  private generateGenericResponse(prompt: string): LLMResponse {
    return {
      score: 50,
      missingKeywords: ['Amazon', 'PPC', 'Seller Central'],
      weakSections: ['Professional Summary'],
      improvedSummary: 'Amazon-focused Virtual Assistant with training in PPC workflows, reporting, and client communication.',
      improvedBullets: [],
      skillsRecommendations: ['Amazon Seller Central', 'PPC Reporting'],
      truthWarnings: [],
      improvedVersion: prompt,
    };
  }
  
  private fallbackResponse(text: string, responseType: string): LLMResponse {
    console.log('Using fallback response for:', responseType);
    return this.ruleBasedResponse(text, responseType);
  }
}

export { BrowserLLMIntegration };