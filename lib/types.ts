export type LeadStatus = "new" | "contacted" | "closed";
export type ConversationAiState = "active" | "completed" | "stale" | "closed";

/** Set when ai_state becomes completed (or closed when used). */
export type CompletionReason =
  | "required_fields_collected"
  | "max_turns_reached"
  | "manual_close";
export type MessageDirection = "inbound" | "outbound";

export type SetupChecklist = {
  business_info: boolean;
  number_generated: boolean;
  verification_submitted: boolean;
  knowledge_base: boolean;
  forwarding_acknowledged: boolean;
  test_completed: boolean;
};

export type ProvisioningStatus =
  | "not_provisioned"
  | "provisioning"
  | "active"
  | "failed";

export type LineVerificationStatus =
  | "not_started"
  | "draft"
  | "submitted"
  | "needs_changes"
  | "approved"
  | "rejected";

export type TollFreeVerificationStatus =
  | "not_started"
  | "draft"
  | "submitted"
  | "needs_changes"
  | "approved"
  | "rejected";

export type Business = {
  id: string;
  user_id: string;
  business_name: string;
  niche: string;
  primary_service_category: string | null;
  owner_name: string | null;
  owner_email: string;
  owner_phone: string | null;
  onboarding_completed_at: string | null;
  setup_checklist: SetupChecklist;
  created_at: string;
  updated_at: string;
};

export type PhoneNumberRow = {
  id: string;
  business_id: string;
  twilio_sid: string | null;
  phone_number: string;
  type: string;
  verification_status: string;
  provisioning_status: ProvisioningStatus;
  phone_type: string;
  line_verification_status: LineVerificationStatus;
  verification_submitted_at: string | null;
  verification_approved_at: string | null;
  provisioned_at: string | null;
  created_at: string;
};

export type TollFreeVerificationRow = {
  id: string;
  business_id: string;
  phone_number_id: string | null;
  legal_business_name: string | null;
  public_business_name: string | null;
  business_type: string | null;
  website: string | null;
  business_email: string | null;
  business_phone: string | null;
  business_address_line_1: string | null;
  business_address_line_2: string | null;
  business_city: string | null;
  business_state: string | null;
  business_postal_code: string | null;
  business_country: string | null;
  registration_number: string | null;
  use_case_description: string | null;
  sample_message_1: string | null;
  sample_message_2: string | null;
  consent_description: string | null;
  /** Optional stored proof URLs; submission also uses env or product default when empty. */
  opt_in_image_urls: string[] | null;
  status: TollFreeVerificationStatus;
  provider_submission_id: string | null;
  provider_response_payload: Record<string, unknown> | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  /** Last successful Twilio TFV fetch (dashboard sync throttle). */
  tfv_last_polled_at: string | null;
  created_at: string;
  updated_at: string;
};

export type BusinessKnowledgeBaseRow = {
  id: string;
  business_id: string;
  services_offered: string | null;
  service_areas: string | null;
  business_hours: string | null;
  emergency_service_available: boolean;
  excluded_jobs: string | null;
  tone_guidance: string | null;
  ai_notes: string | null;
  created_at: string;
  updated_at: string;
};

export type Lead = {
  id: string;
  business_id: string;
  caller_phone: string;
  caller_name: string | null;
  status: LeadStatus;
  source: string;
  summary: string | null;
  urgency: string | null;
  appointment_timing: string | null;
  vehicle_year: string | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  issue_description: string | null;
  drivable_status: string | null;
  service_address: string | null;
  service_city: string | null;
  service_state: string | null;
  service_postal_code: string | null;
  service_category: string | null;
  callback_notes: string | null;
  twilio_call_sid: string | null;
  created_at: string;
  updated_at: string;
};

export type Conversation = {
  id: string;
  lead_id: string;
  business_id: string;
  caller_phone_normalized: string;
  ai_state: ConversationAiState;
  extracted_json: Record<string, unknown>;
  last_message_at: string;
  stale_at: string | null;
  closed_at: string | null;
  completion_reason: CompletionReason | null;
  completed_at: string | null;
  summary_email_sent_at: string | null;
  created_at: string;
  updated_at: string;
};

export type MessageRow = {
  id: string;
  conversation_id: string;
  direction: MessageDirection;
  body: string;
  provider_message_sid: string | null;
  created_at: string;
};
