-- Allow business owners to delete their leads. CASCADE removes conversations and messages;
-- those tables also need DELETE policies or FK cascade fails under RLS.

create policy "Users can delete own leads"
  on public.leads for delete
  using (
    exists (
      select 1 from public.businesses b
      where b.id = leads.business_id and b.user_id = auth.uid()
    )
  );

create policy "Users can delete own conversations"
  on public.conversations for delete
  using (
    exists (
      select 1 from public.leads l
      join public.businesses b on b.id = l.business_id
      where l.id = conversations.lead_id and b.user_id = auth.uid()
    )
  );

create policy "Users can delete own messages"
  on public.messages for delete
  using (
    exists (
      select 1 from public.conversations c
      join public.leads l on l.id = c.lead_id
      join public.businesses b on b.id = l.business_id
      where c.id = messages.conversation_id and b.user_id = auth.uid()
    )
  );
