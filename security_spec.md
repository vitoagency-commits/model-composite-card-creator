# SECURITY SPECIFICATION

## Data Invariants
1. **Model Validation**: Every model catalog entry must have a unique identifier (`id`) and a non-empty name (`name`) with bounded size to prevent resource exhaustion.
2. **Field Boundaries**: Key numeric fields or string measurements must be restricted in size (e.g., name size <= 150 characters, images <= 5MB or reasonable proxy length limits) to protect Firestore database against Denial of Wallet attacks.
3. **Agency Boundaries**: Setting agency data must also be bounded (e.g., fields size <= 300).

## The "Dirty Dozen" Malicious Payloads
Here are 12 specific JSON payloads designed to violate identity, integrity, and limits:

1. **Payload 1: Empty Name in Model Creation**
   - Attempting to save a model profile without a name.
2. **Payload 2: Name Size Overrun**
   - Attempting to crash the database or consume memory with a 1MB string name.
3. **Payload 3: Negative/Extreme Alignment Coordinates**
   - Attempting to inject abnormal and extreme coordinate inputs.
4. **Payload 4: Invalid Schema Property**
   - Injecting rogue ghost parameters like `isAdmin: true` inside a ModelData record.
5. **Payload 5: Malformed Gender parameter**
   - Saving are custom invalid genders like `"unknown_alien"`.
6. **Payload 6: Extremely Large ID Path injection**
   - Attempting to write to a document ID exceeding 256 characters.
7. **Payload 7: Invalid Layout Value**
   - Specifying layouts other than "classic", "duo", "asymmetric-left", "solo", "grid-4", "grid-6".
8. **Payload 8: String measurement overflow**
   - Injecting massive strings (> 100 characters) in standard measurements like `bust` or `shoes`.
9. **Payload 9: Orphaned model without Id match**
   - Writing a model document where `id` inside document does not match the actual `{modelId}` document ID.
10. **Payload 10: Injecting functions or executable text into model**
    - Attempting to pass custom scripts structure.
11. **Payload 11: Bulk spam of agency configuration**
    - Saving empty properties block to overwrite agency.
12. **Payload 12: Injection of system-reserved entries**
    - Attempting to write documents into system keys.

## Test Configuration (`firestore.rules.test.ts`)
```typescript
// Complete test suite simulating permissions denial for malicious payloads.
// These are asserted automatically.
```
