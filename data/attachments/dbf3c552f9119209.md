# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: example.spec.ts >> Database-Driven API Workflows >> Executes scenario: CIF Maintenance Workflow-individual cif
- Location: tests/example.spec.ts:158:9

# Error details

```
Error: [
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "custNameControl"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "draweeNumber"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "userCodeSegmentation"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "eddPurpose"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "number",
    "code": "invalid_type",
    "path": [
      "indentificationRegisDate"
    ],
    "message": "Invalid input: expected number, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "county"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "nik"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "fatcaTaxpayerNonIndo"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "state"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "eddIncome"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "cifBranch"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "idType"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "shareForOther"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "insiderCode"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "incomeCode"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "debitType"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "customerName"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "investmentCode"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "fatcaTaxpayerAs"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "cifBranchName"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "sic2"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "sic1"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "sic4"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "profitAnalysis"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "sic3"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "idIssue"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "eddOtherInfo"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "individualSegmentation"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "residentCode"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "number",
    "code": "invalid_type",
    "path": [
      "dateOfLastMaint"
    ],
    "message": "Invalid input: expected number, received undefined"
  },
  {
    "expected": "number",
    "code": "invalid_type",
    "path": [
      "relationWithBank"
    ],
    "message": "Invalid input: expected number, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "shortName"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "sic6"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "sic5"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "sic8"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "terminalIp"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "sic7"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "gender"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "userCodeAsset"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "fatcaBornAs"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "employerName"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "ktpNumber"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "terminalId"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "idNumber"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "eddFreqTransactionMonth"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "userCode"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "number",
    "code": "invalid_type",
    "path": [
      "custReview"
    ],
    "message": "Invalid input: expected number, received undefined"
  },
  {
    "expected": "number",
    "code": "invalid_type",
    "path": [
      "retention"
    ],
    "message": "Invalid input: expected number, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "deceasedCustFlag"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "number",
    "code": "invalid_type",
    "path": [
      "bankNumber"
    ],
    "message": "Invalid input: expected number, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "cifNumber"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "placeOfBirth"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "holdMailCode"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "subClass"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "number",
    "code": "invalid_type",
    "path": [
      "fedDate"
    ],
    "message": "Invalid input: expected number, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "dateOfBirth"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "npwpIssuePlace"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "inquiryCode"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "businessIncomeCode"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "religion"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "titleAfterName"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "vipCustomerCode"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "aliasNameFlag"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "sourceOfIncome"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "countryOfCitizen"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "ecrDrawee"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "country"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "customerAlias"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "titleBeforeName"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "possition"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "birthOfDate"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "idStatus"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "mother"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "institution"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "number",
    "code": "invalid_type",
    "path": [
      "ownerDebtor"
    ],
    "message": "Invalid input: expected number, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "customerClass"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "officerCode"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "tin"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "countryOfHeritage"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "agreeTerms"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "creditRating"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "number",
    "code": "invalid_type",
    "path": [
      "boShareholding"
    ],
    "message": "Invalid input: expected number, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "citizen"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "number",
    "code": "invalid_type",
    "path": [
      "fedCode"
    ],
    "message": "Invalid input: expected number, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "jobDesignation"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "prosperaFlag"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "individualIndicator"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "number",
    "code": "invalid_type",
    "path": [
      "idExpiryDate"
    ],
    "message": "Invalid input: expected number, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "boCif"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "agreePromo"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "salaryCode"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "companyId"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "lastChangeUser"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "number",
    "code": "invalid_type",
    "path": [
      "lastChangeTime"
    ],
    "message": "Invalid input: expected number, received undefined"
  },
  {
    "expected": "number",
    "code": "invalid_type",
    "path": [
      "debitNumber"
    ],
    "message": "Invalid input: expected number, received undefined"
  },
  {
    "expected": "number",
    "code": "invalid_type",
    "path": [
      "location1"
    ],
    "message": "Invalid input: expected number, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "jobDescription"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "number",
    "code": "invalid_type",
    "path": [
      "stateCode"
    ],
    "message": "Invalid input: expected number, received undefined"
  },
  {
    "expected": "number",
    "code": "invalid_type",
    "path": [
      "startDayEmploy"
    ],
    "message": "Invalid input: expected number, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "maritalStatus"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "cif"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "purpose"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "number",
    "code": "invalid_type",
    "path": [
      "cifCombinedCycle"
    ],
    "message": "Invalid input: expected number, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "expensesCode"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "customerStatus"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "number",
    "code": "invalid_type",
    "path": [
      "smsaCode"
    ],
    "message": "Invalid input: expected number, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "class"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "eddOtherJob"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "cifGroupCode"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "npwpNumber"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "number",
    "code": "invalid_type",
    "path": [
      "lastChangeDate"
    ],
    "message": "Invalid input: expected number, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "userCodeMailing"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "fullName"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "geoCode"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "brithPlace"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "uic5"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "npwpFlag"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "uic6"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "number",
    "code": "invalid_type",
    "path": [
      "originalCustDate"
    ],
    "message": "Invalid input: expected number, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "uic3"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "uic4"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "uic1"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "uic2"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "number",
    "code": "invalid_type",
    "path": [
      "dateOfBirth8"
    ],
    "message": "Invalid input: expected number, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "priorityFlag"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "businessType"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "eddPosition"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "uic7"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "boRelation"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "uic8"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "internalIndCode"
    ],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "expected": "array",
    "code": "invalid_type",
    "path": [
      "phoneNumbers"
    ],
    "message": "Invalid input: expected array, received undefined"
  },
  {
    "expected": "array",
    "code": "invalid_type",
    "path": [
      "emails"
    ],
    "message": "Invalid input: expected array, received undefined"
  },
  {
    "expected": "array",
    "code": "invalid_type",
    "path": [
      "addresses"
    ],
    "message": "Invalid input: expected array, received undefined"
  },
  {
    "expected": "array",
    "code": "invalid_type",
    "path": [
      "aidns"
    ],
    "message": "Invalid input: expected array, received undefined"
  },
  {
    "expected": "array",
    "code": "invalid_type",
    "path": [
      "electronicAddresses"
    ],
    "message": "Invalid input: expected array, received undefined"
  },
  {
    "expected": "array",
    "code": "invalid_type",
    "path": [
      "dependants"
    ],
    "message": "Invalid input: expected array, received undefined"
  },
  {
    "expected": "array",
    "code": "invalid_type",
    "path": [
      "sourceOfFunds"
    ],
    "message": "Invalid input: expected array, received undefined"
  },
  {
    "expected": "array",
    "code": "invalid_type",
    "path": [
      "stakeHolders"
    ],
    "message": "Invalid input: expected array, received undefined"
  },
  {
    "expected": "array",
    "code": "invalid_type",
    "path": [
      "sme"
    ],
    "message": "Invalid input: expected array, received undefined"
  },
  {
    "expected": "array",
    "code": "invalid_type",
    "path": [
      "institutionSegmentation"
    ],
    "message": "Invalid input: expected array, received undefined"
  }
]

expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
```

# Test source

```ts
  209 |                 new RegExp(`\\{\\{${k}\\}\\}`, 'g'),
  210 |                 () => JSON.stringify(String(value ?? '')).slice(1, -1)
  211 |               );
  212 |             }
  213 |           }
  214 | 
  215 |           const sequenceNumber = getNextSequence();
  216 | 
  217 |           // 2. Handle DB Sequence once outside the loop
  218 |           if (dynamicPayload && dynamicPayload.includes('{{sequence}}')) {
  219 |             const uniqueSequence = db.prepare('SELECT SEQUENCE FROM UTILS').get() as { SEQUENCE?: string | number };
  220 |             const seqValue = uniqueSequence?.SEQUENCE ?? 0;
  221 | 
  222 |             dynamicPayload = dynamicPayload.replace(/{{sequence}}/g, String(seqValue));
  223 |             db.prepare('UPDATE UTILS SET SEQUENCE = SEQUENCE + 1').run();
  224 |           }
  225 | 
  226 |           // Header Construction
  227 |           const headers = getSignedHeadersForStep(step.TYPE, dynamicEndpoint, dynamicPayload);
  228 | 
  229 |           // Fix potential port/host syntax malformations
  230 |           const finalUrl = resolveFetchEndpoint(dynamicEndpoint, baseURL);
  231 | 
  232 |           // --- Phase 2: Request Execution ---
  233 | 
  234 |           // Safely parse payload back to JSON object
  235 |           let requestData;
  236 |           try {
  237 |             requestData = dynamicPayload ? JSON.parse(dynamicPayload) : undefined;
  238 |           } catch (e: any) {
  239 |             throw new Error(`Invalid JSON payload for "${step.TITLE}": ${e.message}\n${dynamicPayload}`);
  240 |           }
  241 |           const uniqueSequenceHeader = db.prepare('SELECT SEQUENCE FROM UTILS').get() as { SEQUENCE?: string };
  242 | 
  243 |           // 2. Format request payload with JSON stringified data, or switch to ContentType.TEXT
  244 |           const requestPayload = {
  245 |             type: step.TYPE,
  246 |             data: requestData,
  247 |             sequence: uniqueSequenceHeader.SEQUENCE
  248 |           };
  249 | 
  250 |           // Execute the HTTP call with retry logic for transient timeouts
  251 |           let response;
  252 |           let attempt = 1;
  253 |           const maxRetries = 3;
  254 | 
  255 |           while (attempt <= maxRetries) {
  256 |             try {
  257 |               response = await api.call(step.TYPE, finalUrl, {
  258 |                 timeout: 25000, // Increased timeout to 25s for slow server responses
  259 |                 data: requestData,
  260 |                 headers: {
  261 |                   ...headers,
  262 |                   'X-Btn-Key': process.env.API_KEY || '',
  263 |                   'Btn-Reference-Number': `B0250${sequenceNumber}`,
  264 |                   'Btn-User-Id': 'BTN0010042',
  265 |                   'Btn-Terminal-Id': 'PCDIMAS',
  266 |                   'Btn-Terminal-Ip': '10.99.17.134'
  267 |                 }
  268 |               });
  269 |               break; // Break loop if successful
  270 |             } catch (err: any) {
  271 |               if (attempt === maxRetries) throw err;
  272 |               console.warn(`Attempt ${attempt} failed for ${finalUrl}: ${err.message}. Retrying...`);
  273 |               await new Promise((res) => setTimeout(res, 2000 * attempt)); // Wait before retry
  274 |               attempt++;
  275 |             }
  276 |           }
  277 | 
  278 |           let responseBody;
  279 |           try {
  280 |             responseBody = await response!.json();
  281 |           } catch (e) {
  282 |             responseBody = await response!.text();
  283 |           }
  284 | 
  285 |           const responseContent = JSON.stringify({
  286 |             status: response!.status(),
  287 |             headers: response!.headers(),
  288 |             body: responseBody
  289 |           }, null, 2);
  290 | 
  291 | 
  292 |           db.prepare('UPDATE UTILS SET SEQUENCE = SEQUENCE + 1').run(); // Increment sequence for next use
  293 | 
  294 |           //console.log(`Step: ${step.TITLE } | Endpoint: ${finalUrl} | Status: ${response.status()} | Request Body: ${dynamicPayload || 'N/A'} | Response Body: ${await response.text()}`);
  295 | 
  296 |           // Base Assertion: Verify the HTTP status code matches the expected outcome from the DB
  297 |           expect(response!.status()).toBe(step.EXPECTED_STATUS);
  298 | 
  299 |           // --- Phase 3: Schema Validation ---
  300 | 
  301 |           if (step.EXPECTED_SCHEMA) {
  302 |             // Convert the stringified expected schema from the DB into an active validation schema (e.g., Zod)
  303 |             const InferredSchema = generateDynamicSchema(JSON.parse(step.EXPECTED_SCHEMA));
  304 | 
  305 |             // Parse response body if request succeeded, otherwise validate an empty object
  306 |             const validationResult = InferredSchema.safeParse(await response!.json());
  307 | 
  308 |             // Assert schema validity. If it fails, Playwright will log validationResult.error?.message
> 309 |             expect(validationResult.success, validationResult.error?.message).toBe(true);
      |                                                                               ^ Error: [
  310 |           }
  311 |           // --- Phase 4: State Extraction ---
  312 | 
  313 |           // If the database tells us to extract values from this response for future steps
  314 |           if (step.EXTRACT_KEY) {
  315 |             const body = await response!.json();
  316 |             const rules = JSON.parse(step.EXTRACT_KEY);
  317 | 
  318 |             for (const [stateKey, responsePath] of Object.entries(rules)) {
  319 |               let sourceData = body;
  320 |               let path = responsePath as string;
  321 | 
  322 |               // Direct extraction from request payload
  323 |               if (path.startsWith('req.') || path.startsWith('request.')) {
  324 |                 sourceData = requestData; // Pass the request body object here
  325 |                 path = path.replace(/^(req|request)\./, '');
  326 |               } else if (path.startsWith('res.') || path.startsWith('response.')) {
  327 |                 path = path.replace(/^(res|response)\./, '');
  328 |               }
  329 | 
  330 |               const extractedValue = getNestedValue(sourceData, path);
  331 |               testState[stateKey] = extractedValue;
  332 |             }
  333 |           }
  334 |         });
  335 |       }
  336 |     });
  337 |   }
  338 | });
```