// Original course content, grounded in pinned TigerBeetle sources.
export const tigerbeetleChapters = [
  {
    "id": "tb-orientation",
    "title": "Meet TigerBeetle",
    "description": "Understand the database, then make real transfers.",
    "icon": "01",
    "trackId": "tigerbeetle",
    "lessons": [
      {
        "id": "tb-welcome",
        "title": "What your team is building",
        "kind": "reading",
        "minutes": 12,
        "description": "TigerBeetle records accounts and transfers with a fixed debit-credit schema.",
        "body": "## Where it fits\nAn application owns user authentication, authorization, business workflows, and descriptive metadata. TigerBeetle owns the transactional accounting record. A general-purpose database can store names and invoices; stable identifiers connect those records to accounts and transfers. There is no arbitrary SQL transaction language here.\n\n## A useful mental model\nA transfer increments one account’s cumulative debits and another account’s cumulative credits by the same integer amount. Transfers operate within one ledger. Those counters are not a single signed balance; the application chooses the appropriate balance convention for each account type.\n\n## Your learning route\nFirst use the actual database, then investigate its source. The live labs use TigerBeetle 0.17.9 and a disposable single replica. Zig model exercises develop the language skills behind the implementation. Source investigations use commit cc1c06a924e49b11089c521b2209d34c92caaf18. The final upstream test lab compiles actual TigerBeetle code with its own Zig 0.14.1.\n\n## Explain it at work\nBefore continuing, describe a business operation your team records, the two accounts it affects, the asset unit, and where authorization happens. Keep that example in mind throughout the course. Course completion measures practice; mastery also requires reviewing changes and operating the system with your team.",
        "references": [
          {
            "title": "start.md",
            "url": "https://github.com/tigerbeetle/tigerbeetle/blob/cc1c06a924e49b11089c521b2209d34c92caaf18/docs/start.md"
          },
          {
            "title": "system-architecture.md",
            "url": "https://github.com/tigerbeetle/tigerbeetle/blob/cc1c06a924e49b11089c521b2209d34c92caaf18/docs/coding/system-architecture.md"
          }
        ],
        "sourceKeys": [
          "architecture"
        ]
      },
      {
        "id": "tb-create-accounts",
        "title": "Lab: create the accounts",
        "kind": "exercise",
        "engine": "tigerbeetle",
        "minutes": 20,
        "description": "Create the two durable records needed for a transfer.",
        "body": "The REPL accepts comma-separated events in one batch. Use positive nonzero IDs, ledger 700, and code 10. Unspecified counters and timestamps start at zero. Account creation is immutable; flags and policy must be chosen before it is created.\n\n```text\ncreate_accounts id=1 ledger=700 code=10, id=2 ledger=700 code=10;\n```\n\n## Local lab contract\nEach run formats a fresh single-replica development cluster, applies the stated fixture, runs each semicolon-terminated REPL command, verifies real database state, and removes the data file. These labs do not connect to an existing database. Single-replica development mode does not demonstrate production fault tolerance.",
        "task": "Create accounts 101 and 102 on ledger 700, both with code 10. The fixture is empty. Use lookup_accounts to inspect them if you like.",
        "starter": "create_accounts id=101 ledger=700 code=10;\n",
        "solution": "create_accounts id=101 ledger=700 code=10, id=102 ledger=700 code=10;\n",
        "setup": [],
        "checks": [
          {
            "name": "both account IDs exist on the correct ledger",
            "command": "lookup_accounts id=101,id=102;",
            "expect": [
              {
                "id": "101",
                "ledger": "700",
                "code": "10"
              },
              {
                "id": "102",
                "ledger": "700",
                "code": "10"
              }
            ],
            "count": 2
          }
        ],
        "tests": "• both account IDs exist on the correct ledger",
        "hints": [
          "Separate the two account events with a comma.",
          "Both events belong to the same create_accounts command. End it with a semicolon."
        ],
        "references": [
          {
            "title": "start.md",
            "url": "https://github.com/tigerbeetle/tigerbeetle/blob/cc1c06a924e49b11089c521b2209d34c92caaf18/docs/start.md"
          },
          {
            "title": "account.md",
            "url": "https://github.com/tigerbeetle/tigerbeetle/blob/cc1c06a924e49b11089c521b2209d34c92caaf18/docs/reference/account.md"
          }
        ]
      },
      {
        "id": "tb-first-transfer",
        "title": "Lab: move an integer amount",
        "kind": "exercise",
        "engine": "tigerbeetle",
        "minutes": 20,
        "description": "Read both sides of a real double-entry transfer.",
        "body": "A successful transfer does not subtract from a stored balance field. It adds amount to the debit account’s debits_posted and the credit account’s credits_posted. Neither account has a nonnegative-balance restriction in this lab. The asset scale is an application choice; 125 might mean 125 cents.\n\n## Local lab contract\nEach run formats a fresh single-replica development cluster, applies the stated fixture, runs each semicolon-terminated REPL command, verifies real database state, and removes the data file. These labs do not connect to an existing database. Single-replica development mode does not demonstrate production fault tolerance.",
        "task": "The fixture creates accounts 101 and 102 on ledger 700, code 10. Create transfer 1001 from debit account 101 to credit account 102 for exactly 125 units, ledger 700, code 10.",
        "starter": "create_transfers id=1001 debit_account_id=101 credit_account_id=102 amount=12 ledger=700 code=10;\n",
        "solution": "create_transfers id=1001 debit_account_id=101 credit_account_id=102 amount=125 ledger=700 code=10;\n",
        "setup": [
          "create_accounts id=101 ledger=700 code=10, id=102 ledger=700 code=10;"
        ],
        "checks": [
          {
            "name": "debit counter increased by 125",
            "command": "lookup_accounts id=101;",
            "expect": [
              {
                "id": "101",
                "debits_posted": "125",
                "credits_posted": "0"
              }
            ]
          },
          {
            "name": "credit counter increased by 125",
            "command": "lookup_accounts id=102;",
            "expect": [
              {
                "id": "102",
                "credits_posted": "125",
                "debits_posted": "0"
              }
            ]
          },
          {
            "name": "immutable transfer recorded",
            "command": "lookup_transfers id=1001;",
            "expect": [
              {
                "id": "1001",
                "amount": "125",
                "ledger": "700"
              }
            ]
          }
        ],
        "tests": "• debit counter increased by 125\n• credit counter increased by 125\n• immutable transfer recorded",
        "hints": [
          "Set debit_account_id=101 and credit_account_id=102.",
          "Use amount=125 and preserve the fixture ledger and code."
        ],
        "references": [
          {
            "title": "transfer.md",
            "url": "https://github.com/tigerbeetle/tigerbeetle/blob/cc1c06a924e49b11089c521b2209d34c92caaf18/docs/reference/transfer.md"
          }
        ]
      },
      {
        "id": "tb-quiz-orientation",
        "title": "Checkpoint: orientation",
        "kind": "quiz",
        "minutes": 8,
        "description": "Explain the model, then check your understanding. Retry freely.",
        "questions": [
          {
            "prompt": "Which part should authorize a customer transfer?",
            "options": [
              "The application/API boundary",
              "An account ID itself",
              "The ledger number"
            ],
            "answer": 0,
            "explanation": "Account and ledger identifiers are not an authorization mechanism. The application must decide who may submit each operation."
          },
          {
            "prompt": "A posted transfer of 25 changes which counters?",
            "options": [
              "Debit account credits and credit account debits",
              "Debit account debits_posted and credit account credits_posted",
              "A shared signed balance"
            ],
            "answer": 1,
            "explanation": "The two cumulative counters increase by the same amount. Balance conventions are applied separately."
          },
          {
            "prompt": "What does a single development replica demonstrate?",
            "options": [
              "Production high availability",
              "Tolerance of independent disk corruption",
              "API behavior and local experimentation"
            ],
            "answer": 2,
            "explanation": "One replica is useful for learning but does not provide replication or independent fault domains."
          },
          {
            "prompt": "Where should human-readable account metadata usually live?",
            "options": [
              "A control-plane/general-purpose database linked by IDs",
              "In the amount field",
              "In a new SQL table inside TigerBeetle"
            ],
            "answer": 0,
            "explanation": "TigerBeetle has a fixed schema. Application metadata belongs in the surrounding system."
          }
        ]
      }
    ]
  },
  {
    "id": "tb-modeling",
    "title": "Model accounts and assets",
    "description": "Use integer units, wide counters, and ledger boundaries.",
    "icon": "02",
    "trackId": "tigerbeetle",
    "lessons": [
      {
        "id": "tb-modeling-theory",
        "title": "Debits, credits, and asset units",
        "kind": "reading",
        "minutes": 12,
        "description": "Account type determines how cumulative counters become a balance.",
        "body": "## Pick the convention deliberately\nFor an asset or expense account, a debit balance is debits_posted minus credits_posted. For a liability or income account, a credit balance is credits_posted minus debits_posted. A customer wallet can be modeled as an operator liability, but your team must document its own chart of accounts. Debit does not universally mean “money out.”\n\n## Use exact units\nRepresent amounts as integer quantities at an agreed scale. Keep currency and scale metadata outside TigerBeetle. Its amount and account counters are u128; a JavaScript Number cannot exactly represent that range. Official Node SDK examples use BigInt. Avoid lossy conversions and floating-point accounting.\n\n## Ledgers separate quantities\nA direct transfer requires both accounts and the transfer to agree on the ledger. A USD quantity cannot be directly added to an EUR quantity. An exchange uses separate accounts and separate transfers per ledger, linked into an atomic chain when required. Ledger IDs partition data; they do not replace access control.\n\n## Review prompt\nDraw the four accounts for an exchange with two currencies. Explain which rate calculation belongs in the application and which atomic relationship TigerBeetle enforces.",
        "references": [
          {
            "title": "data-modeling.md",
            "url": "https://github.com/tigerbeetle/tigerbeetle/blob/cc1c06a924e49b11089c521b2209d34c92caaf18/docs/coding/data-modeling.md"
          },
          {
            "title": "debit-credit.md",
            "url": "https://github.com/tigerbeetle/tigerbeetle/blob/cc1c06a924e49b11089c521b2209d34c92caaf18/docs/concepts/debit-credit.md"
          }
        ],
        "sourceKeys": []
      },
      {
        "id": "tb-balance",
        "title": "Zig model: a full-width balance",
        "kind": "exercise",
        "engine": "zig",
        "minutes": 20,
        "description": "A u128 difference cannot always fit into i128.",
        "body": "This is an educational Zig model inspired by the project, compiled with the foundations compiler (0.17.0). It is not imported TigerBeetle production code; the pinned upstream source uses Zig 0.14.1.",
        "task": "Return `credit_balance(credits: u128, debits: u128) Balance`, where Balance has negative: bool and magnitude: u128. Equal counters must give negative=false and magnitude=0. Preserve the complete u128 range.",
        "starter": "pub const Balance = struct { negative: bool, magnitude: u128 };\npub fn credit_balance(credits: u128, debits: u128) Balance {\n    return .{ .negative = false, .magnitude = credits +| debits };\n}\n",
        "solution": "pub const Balance = struct { negative: bool, magnitude: u128 };\npub fn credit_balance(credits: u128, debits: u128) Balance {\n    if (credits >= debits) return .{ .negative = false, .magnitude = credits - debits };\n    return .{ .negative = true, .magnitude = debits - credits };\n}\n",
        "tests": "test \"full-width balances\" {\n    const positive = learner.credit_balance(100, 30);\n    try std.testing.expect(!positive.negative);\n    try std.testing.expectEqual(@as(u128, 70), positive.magnitude);\n    const negative = learner.credit_balance(0, std.math.maxInt(u128));\n    try std.testing.expect(negative.negative);\n    try std.testing.expectEqual(std.math.maxInt(u128), negative.magnitude);\n    const zero = learner.credit_balance(5, 5);\n    try std.testing.expect(!zero.negative);\n    try std.testing.expectEqual(@as(u128, 0), zero.magnitude);\n}\n",
        "hints": [
          "Compare before subtracting.",
          "Represent the sign separately instead of narrowing to a signed integer."
        ],
        "references": [
          {
            "title": "tigerbeetle.zig",
            "url": "https://github.com/tigerbeetle/tigerbeetle/blob/cc1c06a924e49b11089c521b2209d34c92caaf18/src/tigerbeetle.zig"
          },
          {
            "title": "data-modeling.md",
            "url": "https://github.com/tigerbeetle/tigerbeetle/blob/cc1c06a924e49b11089c521b2209d34c92caaf18/docs/coding/data-modeling.md"
          }
        ],
        "sourceKeys": [
          "account"
        ]
      },
      {
        "id": "tb-two-ledgers",
        "title": "Lab: separate two assets",
        "kind": "exercise",
        "engine": "tigerbeetle",
        "minutes": 20,
        "description": "Keep each asset’s accounts and transfers on its own ledger.",
        "body": "## Local lab contract\nEach run formats a fresh single-replica development cluster, applies the stated fixture, runs each semicolon-terminated REPL command, verifies real database state, and removes the data file. These labs do not connect to an existing database. Single-replica development mode does not demonstrate production fault tolerance.",
        "task": "The fixture is empty. Create accounts 201/202 on ledger 840 and 301/302 on ledger 978, all code 10. Transfer 1500 units from 201 to 202 with ID 2001; transfer 900 units from 301 to 302 with ID 3001. Use code 10. This lab practices ledger separation; it does not model an FX rate.",
        "starter": "create_accounts id=201 ledger=840 code=10, id=202 ledger=840 code=10;\n",
        "solution": "create_accounts id=201 ledger=840 code=10, id=202 ledger=840 code=10, id=301 ledger=978 code=10, id=302 ledger=978 code=10;\ncreate_transfers id=2001 debit_account_id=201 credit_account_id=202 amount=1500 ledger=840 code=10, id=3001 debit_account_id=301 credit_account_id=302 amount=900 ledger=978 code=10;\n",
        "setup": [],
        "checks": [
          {
            "name": "first asset counters",
            "command": "lookup_accounts id=201,id=202;",
            "expect": [
              {
                "id": "201",
                "ledger": "840",
                "debits_posted": "1500"
              },
              {
                "id": "202",
                "ledger": "840",
                "credits_posted": "1500"
              }
            ],
            "count": 2
          },
          {
            "name": "second asset counters",
            "command": "lookup_accounts id=301,id=302;",
            "expect": [
              {
                "id": "301",
                "ledger": "978",
                "debits_posted": "900"
              },
              {
                "id": "302",
                "ledger": "978",
                "credits_posted": "900"
              }
            ],
            "count": 2
          }
        ],
        "tests": "• first asset counters\n• second asset counters",
        "hints": [
          "Create four accounts, with each pair sharing one ledger.",
          "Each transfer must use the same ledger as its own two accounts."
        ],
        "references": [
          {
            "title": "data-modeling.md",
            "url": "https://github.com/tigerbeetle/tigerbeetle/blob/cc1c06a924e49b11089c521b2209d34c92caaf18/docs/coding/data-modeling.md"
          }
        ]
      },
      {
        "id": "tb-quiz-modeling",
        "title": "Checkpoint: modeling",
        "kind": "quiz",
        "minutes": 8,
        "description": "Explain the model, then check your understanding. Retry freely.",
        "questions": [
          {
            "prompt": "A credit-normal account’s posted balance is:",
            "options": [
              "debits_posted + credits_posted",
              "credits_posted - debits_posted",
              "Always debits_posted"
            ],
            "answer": 1,
            "explanation": "A credit-normal balance subtracts posted debits from posted credits."
          },
          {
            "prompt": "Why avoid JavaScript Number for arbitrary TigerBeetle amounts?",
            "options": [
              "It cannot exactly represent the full u128 domain",
              "It is always unsigned",
              "It cannot represent zero"
            ],
            "answer": 0,
            "explanation": "Number has finite integer precision well below 128 bits. Use the SDK’s integer representation, such as BigInt."
          },
          {
            "prompt": "Can one direct transfer connect accounts on different ledgers?",
            "options": [
              "Yes, if the amount is zero",
              "Yes, if IDs are globally unique",
              "No; model separate ledger-local transfers"
            ],
            "answer": 2,
            "explanation": "The accounts and transfer must share a ledger. Exchange recipes compose multiple transfers."
          },
          {
            "prompt": "Why use magnitude and sign in the Zig balance model?",
            "options": [
              "It saves a database call",
              "The complete u128 difference can exceed i128",
              "It is a production TigerBeetle balance struct"
            ],
            "answer": 1,
            "explanation": "A signed i128 cannot represent every difference between two u128 values. The model preserves the full magnitude."
          }
        ]
      }
    ]
  },
  {
    "id": "tb-reliability",
    "title": "Submit safely, batch deliberately",
    "description": "Identity, idempotency, conflicts, and linked outcomes.",
    "icon": "03",
    "trackId": "tigerbeetle",
    "lessons": [
      {
        "id": "tb-reliability-theory",
        "title": "An ambiguous response is not a failed transfer",
        "kind": "reading",
        "minutes": 12,
        "description": "Persist a stable operation ID before the first submission.",
        "body": "## Retry the same intent\nA timeout can mean the request was lost, or that it committed and only the reply was lost. Retrying with a new transfer ID can create a second economic event. Persist the original ID and payload, then retry the same intent. An identical existing record confirms that intent; an exists_with_different_* result is a conflict requiring investigation.\n\n## Batch is not atomic by default\nEvents in one request have independent outcomes unless they are explicitly linked. A linked flag joins an event to the next event. The last member of the chain has no linked flag. Independent chains can coexist in one request. When one member fails, the chain is rolled back; inspect all event results.\n\n## Version-specific client behavior\nIn the pinned 0.17.9 release, create operations return a result for each event, with created for a successful new record. Older clients used sparse error arrays. Read the SDK and protocol documentation for the version your team uses; do not treat an old sample’s empty response as a universal success contract.\n\n## At work\nWrite a retry table for transport timeout, created, exists, exists_with_different_amount, and a business rejection. Explain how the original intent survives an application restart.\n\n## Linked retry nuance\nA replayed linked chain can return exists for its first event and linked_event_failed for later members. Do not expect one exists result per member. Look up the original event IDs and compare their economic fields with the persisted intent before confirming the complete group. The wallet capstone exercises this exact behavior against the pinned release.",
        "references": [
          {
            "title": "reliable-transaction-submission.md",
            "url": "https://github.com/tigerbeetle/tigerbeetle/blob/cc1c06a924e49b11089c521b2209d34c92caaf18/docs/coding/reliable-transaction-submission.md"
          },
          {
            "title": "linked-events.md",
            "url": "https://github.com/tigerbeetle/tigerbeetle/blob/cc1c06a924e49b11089c521b2209d34c92caaf18/docs/coding/linked-events.md"
          },
          {
            "title": "create_transfers.md",
            "url": "https://github.com/tigerbeetle/tigerbeetle/blob/cc1c06a924e49b11089c521b2209d34c92caaf18/docs/reference/requests/create_transfers.md"
          }
        ],
        "sourceKeys": []
      },
      {
        "id": "tb-idempotency",
        "title": "Lab: replay the same intent",
        "kind": "exercise",
        "engine": "tigerbeetle",
        "minutes": 20,
        "description": "See the difference between retrying and duplicating.",
        "body": "## Local lab contract\nEach run formats a fresh single-replica development cluster, applies the stated fixture, runs each semicolon-terminated REPL command, verifies real database state, and removes the data file. These labs do not connect to an existing database. Single-replica development mode does not demonstrate production fault tolerance.",
        "task": "Fixture: accounts 101 and 102, ledger 700, code 10. Submit a transfer of 25 units using ID 1001, then retry the identical transfer. The final debit must be 25 and at least one response must report exists.",
        "starter": "create_transfers id=1001 debit_account_id=101 credit_account_id=102 amount=25 ledger=700 code=10;\ncreate_transfers id=1002 debit_account_id=101 credit_account_id=102 amount=25 ledger=700 code=10;\n",
        "solution": "create_transfers id=1001 debit_account_id=101 credit_account_id=102 amount=25 ledger=700 code=10;\ncreate_transfers id=1001 debit_account_id=101 credit_account_id=102 amount=25 ledger=700 code=10;\n",
        "setup": [
          "create_accounts id=101 ledger=700 code=10, id=102 ledger=700 code=10;"
        ],
        "checks": [
          {
            "name": "one economic effect",
            "command": "lookup_accounts id=101;",
            "expect": [
              {
                "id": "101",
                "debits_posted": "25"
              }
            ]
          },
          {
            "name": "original intent retained",
            "command": "lookup_transfers id=1001;",
            "expect": [
              {
                "id": "1001",
                "amount": "25"
              }
            ],
            "count": 1
          },
          {
            "name": "retry returned exists",
            "status": "exists"
          }
        ],
        "tests": "• one economic effect\n• original intent retained\n• retry returned exists",
        "hints": [
          "Retries must keep both ID and payload unchanged.",
          "Use id=1001 in both create_transfers commands."
        ],
        "references": [
          {
            "title": "reliable-transaction-submission.md",
            "url": "https://github.com/tigerbeetle/tigerbeetle/blob/cc1c06a924e49b11089c521b2209d34c92caaf18/docs/coding/reliable-transaction-submission.md"
          }
        ]
      },
      {
        "id": "tb-linked-rollback",
        "title": "Lab: an atomic chain can fail",
        "kind": "exercise",
        "engine": "tigerbeetle",
        "minutes": 20,
        "description": "Observe rollback and independent success in the same workflow.",
        "body": "## Local lab contract\nEach run formats a fresh single-replica development cluster, applies the stated fixture, runs each semicolon-terminated REPL command, verifies real database state, and removes the data file. These labs do not connect to an existing database. Single-replica development mode does not demonstrate production fault tolerance.",
        "task": "Fixture: accounts 101 and 102 exist; account 999 does not. Submit one batch: transfer 2001 from 101 to 102 for 10 units linked to transfer 2002 from 101 to missing account 999 for 5 units. Then submit independent transfer 2003 from 101 to 102 for 7. All use ledger 700, code 10. The chain must disappear and the independent transfer must remain.",
        "starter": "create_transfers id=2001 debit_account_id=101 credit_account_id=102 amount=10 ledger=700 code=10, id=2002 debit_account_id=101 credit_account_id=999 amount=5 ledger=700 code=10;\ncreate_transfers id=2003 debit_account_id=101 credit_account_id=102 amount=7 ledger=700 code=10;\n",
        "solution": "create_transfers id=2001 debit_account_id=101 credit_account_id=102 amount=10 ledger=700 code=10 flags=linked, id=2002 debit_account_id=101 credit_account_id=999 amount=5 ledger=700 code=10;\ncreate_transfers id=2003 debit_account_id=101 credit_account_id=102 amount=7 ledger=700 code=10;\n",
        "setup": [
          "create_accounts id=101 ledger=700 code=10, id=102 ledger=700 code=10;"
        ],
        "checks": [
          {
            "name": "failed chain left no records",
            "command": "lookup_transfers id=2001,id=2002;",
            "count": 0
          },
          {
            "name": "independent event committed",
            "command": "lookup_accounts id=102;",
            "expect": [
              {
                "id": "102",
                "credits_posted": "7"
              }
            ]
          },
          {
            "name": "chain reported rollback",
            "status": "linked_event_failed"
          },
          {
            "name": "root failure identified",
            "status": "credit_account_not_found"
          }
        ],
        "tests": "• failed chain left no records\n• independent event committed\n• chain reported rollback\n• root failure identified",
        "hints": [
          "Only 2001 needs flags=linked; 2002 closes the chain.",
          "The comma puts both linked events in the same request. Separate commands cannot be linked."
        ],
        "references": [
          {
            "title": "linked-events.md",
            "url": "https://github.com/tigerbeetle/tigerbeetle/blob/cc1c06a924e49b11089c521b2209d34c92caaf18/docs/coding/linked-events.md"
          }
        ]
      },
      {
        "id": "tb-quiz-reliability",
        "title": "Checkpoint: reliability",
        "kind": "quiz",
        "minutes": 8,
        "description": "Explain the model, then check your understanding. Retry freely.",
        "questions": [
          {
            "prompt": "The client times out after submission. What ID should a retry use?",
            "options": [
              "A newly generated ID",
              "The original persisted ID",
              "The current timestamp only"
            ],
            "answer": 1,
            "explanation": "The original ID ties retries to the same intent even if a previous attempt already committed."
          },
          {
            "prompt": "Which flags describe a linked chain of three events?",
            "options": [
              "linked, linked, no linked",
              "linked, linked, linked",
              "no linked, linked, linked"
            ],
            "answer": 0,
            "explanation": "A linked flag connects to the next event. The first event without it closes the chain."
          },
          {
            "prompt": "What does exists_with_different_amount mean?",
            "options": [
              "The new amount replaced the old one",
              "A harmless successful retry",
              "The ID was reused for different content"
            ],
            "answer": 2,
            "explanation": "Treat this as a payload conflict. Do not silently accept it as confirmation of the new intent."
          },
          {
            "prompt": "How does the pinned 0.17.9 create API report a successful new event?",
            "options": [
              "Only by omitting an error entry",
              "With a per-event created status",
              "By returning the account balance"
            ],
            "answer": 1,
            "explanation": "The course is pinned to the newer dense result format. Older sparse-result examples require version awareness."
          }
        ]
      }
    ]
  },
  {
    "id": "tb-invariants",
    "title": "Enforce the invariant",
    "description": "Move balance checks into the atomic operation.",
    "icon": "04",
    "trackId": "tigerbeetle",
    "lessons": [
      {
        "id": "tb-invariants-theory",
        "title": "Make an impossible state unrepresentable",
        "kind": "reading",
        "minutes": 12,
        "description": "A read-then-check balance workflow races with concurrent transfers.",
        "body": "## Let the database enforce the bound\nFor a credit-normal wallet, debits_must_not_exceed_credits prevents posted debits plus pending debits from exceeding posted credits. For a debit-normal account, credits_must_not_exceed_debits enforces the symmetric condition. Choose flags when creating the account; they are policy, not a UI-only check.\n\n## Pending counts matter\nA reservation consumes availability before posting. A client display can estimate available credit as credits_posted - debits_posted - debits_pending, provided it handles inconsistent inputs and arithmetic safely. The database remains authoritative at submission time: even a recent displayed balance can become stale.\n\n## Trust boundaries\nNever substitute assertions for validation of malformed user input or normal business rejections. Return or handle those errors. Internal assertions encode states that a correct implementation should never violate. TigerStyle emphasizes both careful external error handling and strong internal invariants.",
        "references": [
          {
            "title": "account.md",
            "url": "https://github.com/tigerbeetle/tigerbeetle/blob/cc1c06a924e49b11089c521b2209d34c92caaf18/docs/reference/account.md"
          },
          {
            "title": "two-phase-transfers.md",
            "url": "https://github.com/tigerbeetle/tigerbeetle/blob/cc1c06a924e49b11089c521b2209d34c92caaf18/docs/coding/two-phase-transfers.md"
          },
          {
            "title": "TIGER_STYLE.md",
            "url": "https://github.com/tigerbeetle/tigerbeetle/blob/cc1c06a924e49b11089c521b2209d34c92caaf18/docs/TIGER_STYLE.md"
          }
        ],
        "sourceKeys": [
          "account",
          "tiger-style"
        ]
      },
      {
        "id": "tb-no-overdraft",
        "title": "Lab: reject an overdraw",
        "kind": "exercise",
        "engine": "tigerbeetle",
        "minutes": 20,
        "description": "Use an account policy instead of a client-side race.",
        "body": "## Local lab contract\nEach run formats a fresh single-replica development cluster, applies the stated fixture, runs each semicolon-terminated REPL command, verifies real database state, and removes the data file. These labs do not connect to an existing database. Single-replica development mode does not demonstrate production fault tolerance.",
        "task": "Fixture: source 101, wallet 102 with debits_must_not_exceed_credits, and merchant 103; ledger 700, code 10. Transfer 900 has funded wallet 102 with 100 units. Submit transfer 1001 from 102 to 103 for 80 units, then transfer 1002 for 25. Observe exceeds_credits for the second attempt.",
        "starter": "create_transfers id=1001 debit_account_id=102 credit_account_id=103 amount=80 ledger=700 code=10;\ncreate_transfers id=1002 debit_account_id=102 credit_account_id=103 amount=20 ledger=700 code=10;\n",
        "solution": "create_transfers id=1001 debit_account_id=102 credit_account_id=103 amount=80 ledger=700 code=10;\ncreate_transfers id=1002 debit_account_id=102 credit_account_id=103 amount=25 ledger=700 code=10;\n",
        "setup": [
          "create_accounts id=101 ledger=700 code=10, id=102 ledger=700 code=10 flags=debits_must_not_exceed_credits, id=103 ledger=700 code=10;",
          "create_transfers id=900 debit_account_id=101 credit_account_id=102 amount=100 ledger=700 code=10;"
        ],
        "checks": [
          {
            "name": "wallet kept its last 20 units",
            "command": "lookup_accounts id=102;",
            "expect": [
              {
                "debits_posted": "80",
                "credits_posted": "100"
              }
            ]
          },
          {
            "name": "merchant received only 80",
            "command": "lookup_accounts id=103;",
            "expect": [
              {
                "credits_posted": "80"
              }
            ]
          },
          {
            "name": "business rejection visible",
            "status": "exceeds_credits"
          }
        ],
        "tests": "• wallet kept its last 20 units\n• merchant received only 80\n• business rejection visible",
        "hints": [
          "Leave the account policy in the fixture unchanged.",
          "The second requested amount is 25; failure is the correct behavior."
        ],
        "references": [
          {
            "title": "account.md",
            "url": "https://github.com/tigerbeetle/tigerbeetle/blob/cc1c06a924e49b11089c521b2209d34c92caaf18/docs/reference/account.md"
          },
          {
            "title": "create_transfers.md",
            "url": "https://github.com/tigerbeetle/tigerbeetle/blob/cc1c06a924e49b11089c521b2209d34c92caaf18/docs/reference/requests/create_transfers.md"
          }
        ]
      },
      {
        "id": "tb-available",
        "title": "Zig model: pending consumes availability",
        "kind": "exercise",
        "engine": "zig",
        "minutes": 20,
        "description": "Subtract only after proving the subtraction is valid.",
        "body": "This is an educational Zig model inspired by the project, compiled with the foundations compiler (0.17.0). It is not imported TigerBeetle production code; the pinned upstream source uses Zig 0.14.1.",
        "task": "Implement `available_credit(credits_posted: u128, debits_posted: u128, debits_pending: u128) u128`. Return the remaining credit, or zero if posted or pending debits would overdraw it. Avoid overflowing an intermediate addition.",
        "starter": "pub fn available_credit(credits_posted: u128, debits_posted: u128, debits_pending: u128) u128 {\n    _ = debits_pending;\n    return credits_posted -| debits_posted;\n}\n",
        "solution": "pub fn available_credit(credits_posted: u128, debits_posted: u128, debits_pending: u128) u128 {\n    if (debits_posted > credits_posted) return 0;\n    const remaining = credits_posted - debits_posted;\n    if (debits_pending > remaining) return 0;\n    return remaining - debits_pending;\n}\n",
        "tests": "test \"availability including edge cases\" {\n    try std.testing.expectEqual(@as(u128, 50), learner.available_credit(100, 30, 20));\n    try std.testing.expectEqual(@as(u128, 0), learner.available_credit(10, 20, 0));\n    try std.testing.expectEqual(@as(u128, 0), learner.available_credit(10, 0, 11));\n    try std.testing.expectEqual(@as(u128, 0), learner.available_credit(std.math.maxInt(u128), std.math.maxInt(u128), std.math.maxInt(u128)));\n    try std.testing.expectEqual(std.math.maxInt(u128), learner.available_credit(std.math.maxInt(u128), 0, 0));\n}\n",
        "hints": [
          "Avoid adding the two debit counters before checking their range.",
          "Subtract posted debits after a guard, then compare pending debits against the remainder."
        ],
        "references": [
          {
            "title": "tigerbeetle.zig",
            "url": "https://github.com/tigerbeetle/tigerbeetle/blob/cc1c06a924e49b11089c521b2209d34c92caaf18/src/tigerbeetle.zig"
          }
        ],
        "sourceKeys": [
          "account"
        ]
      },
      {
        "id": "tb-quiz-invariants",
        "title": "Checkpoint: invariants",
        "kind": "quiz",
        "minutes": 8,
        "description": "Explain the model, then check your understanding. Retry freely.",
        "questions": [
          {
            "prompt": "Why can read-balance-then-submit still overdraw without an account invariant?",
            "options": [
              "Reads never work",
              "Another request can change the balance between operations",
              "Account IDs are not unique"
            ],
            "answer": 1,
            "explanation": "The business check and update must be atomic. A client-side display is not the authoritative enforcement point."
          },
          {
            "prompt": "For a credit-normal wallet, which flag prevents a negative available balance?",
            "options": [
              "debits_must_not_exceed_credits",
              "credits_must_not_exceed_debits",
              "history"
            ],
            "answer": 0,
            "explanation": "The flag bounds posted plus pending debits against posted credits."
          },
          {
            "prompt": "Should a normal insufficient-funds response crash your application as an assertion?",
            "options": [
              "Always",
              "Only in the browser",
              "No; handle the business error"
            ],
            "answer": 2,
            "explanation": "Assertions catch programmer errors. Expected operating and validation errors need explicit handling."
          },
          {
            "prompt": "Why avoid adding arbitrary u128 debit counters before validation?",
            "options": [
              "Addition is always lossy",
              "The intermediate sum can overflow",
              "u128 is floating point"
            ],
            "answer": 1,
            "explanation": "Each counter can be valid individually while their sum exceeds the type’s maximum."
          }
        ]
      }
    ]
  },
  {
    "id": "tb-pending",
    "title": "Reserve, settle, or release",
    "description": "Understand the complete pending-transfer lifecycle.",
    "icon": "05",
    "trackId": "tigerbeetle",
    "lessons": [
      {
        "id": "tb-pending-theory",
        "title": "Two phases, immutable records",
        "kind": "reading",
        "minutes": 12,
        "description": "A reservation and its resolution are separate transfers.",
        "body": "## Reserve\nCreate a transfer with pending. It increases debits_pending and credits_pending, while leaving posted counters unchanged. An optional timeout is a relative interval in seconds, not an absolute wall-clock deadline.\n\n## Settle or release\nCreate a new uniquely identified transfer referencing pending_id. post_pending_transfer can post all or part of the reserved amount. Posting less releases the remainder; it does not leave a second outstanding reservation. void_pending_transfer releases the reservation without posting it. An original pending record remains immutable.\n\n## Resolve once\nA reservation can be posted, voided, or expired once. A second economic resolution gets a lifecycle error. Retrying the same resolution ID is different: idempotency confirms the existing resolution. On this release, amount=0 when posting means zero, not “post everything.” AMOUNT_MAX can request the entire pending amount; explicit amounts are easiest to inspect in these labs.\n\n## Explain the state\nWrite down pending and posted counters before a reservation of 100, after it, and after posting 60. Explain why a later post for the remaining 40 is invalid.",
        "references": [
          {
            "title": "two-phase-transfers.md",
            "url": "https://github.com/tigerbeetle/tigerbeetle/blob/cc1c06a924e49b11089c521b2209d34c92caaf18/docs/coding/two-phase-transfers.md"
          },
          {
            "title": "transfer.md",
            "url": "https://github.com/tigerbeetle/tigerbeetle/blob/cc1c06a924e49b11089c521b2209d34c92caaf18/docs/reference/transfer.md"
          }
        ],
        "sourceKeys": []
      },
      {
        "id": "tb-partial-post",
        "title": "Lab: post part, release the rest",
        "kind": "exercise",
        "engine": "tigerbeetle",
        "minutes": 20,
        "description": "Observe the counters after a partial settlement.",
        "body": "## Local lab contract\nEach run formats a fresh single-replica development cluster, applies the stated fixture, runs each semicolon-terminated REPL command, verifies real database state, and removes the data file. These labs do not connect to an existing database. Single-replica development mode does not demonstrate production fault tolerance.",
        "task": "Fixture: accounts 101/102 and pending transfer 3001 for 100 units, ledger 700, code 10. Create resolution 3002 with pending_id=3001, flags=post_pending_transfer, amount=60. The remaining 40 must be released.",
        "starter": "create_transfers id=3002 pending_id=3001 amount=100 flags=post_pending_transfer;\n",
        "solution": "create_transfers id=3002 pending_id=3001 amount=60 flags=post_pending_transfer;\n",
        "setup": [
          "create_accounts id=101 ledger=700 code=10, id=102 ledger=700 code=10;",
          "create_transfers id=3001 debit_account_id=101 credit_account_id=102 amount=100 ledger=700 code=10 flags=pending;"
        ],
        "checks": [
          {
            "name": "debit reservation released and 60 posted",
            "command": "lookup_accounts id=101;",
            "expect": [
              {
                "debits_pending": "0",
                "debits_posted": "60"
              }
            ]
          },
          {
            "name": "credit reservation released and 60 posted",
            "command": "lookup_accounts id=102;",
            "expect": [
              {
                "credits_pending": "0",
                "credits_posted": "60"
              }
            ]
          },
          {
            "name": "original amount is immutable",
            "command": "lookup_transfers id=3001;",
            "expect": [
              {
                "id": "3001",
                "amount": "100"
              }
            ]
          },
          {
            "name": "separate resolution record",
            "command": "lookup_transfers id=3002;",
            "expect": [
              {
                "pending_id": "3001",
                "amount": "60",
                "flags": "post_pending_transfer"
              }
            ]
          }
        ],
        "tests": "• debit reservation released and 60 posted\n• credit reservation released and 60 posted\n• original amount is immutable\n• separate resolution record",
        "hints": [
          "Use a new ID for the resolution and pending_id for the original.",
          "The explicit settlement amount is 60; the unused reservation is released automatically."
        ],
        "references": [
          {
            "title": "two-phase-transfers.md",
            "url": "https://github.com/tigerbeetle/tigerbeetle/blob/cc1c06a924e49b11089c521b2209d34c92caaf18/docs/coding/two-phase-transfers.md"
          }
        ]
      },
      {
        "id": "tb-void",
        "title": "Lab: release a reservation",
        "kind": "exercise",
        "engine": "tigerbeetle",
        "minutes": 20,
        "description": "Void the reservation without creating a posted movement.",
        "body": "## Local lab contract\nEach run formats a fresh single-replica development cluster, applies the stated fixture, runs each semicolon-terminated REPL command, verifies real database state, and removes the data file. These labs do not connect to an existing database. Single-replica development mode does not demonstrate production fault tolerance.",
        "task": "Fixture: accounts 101/102 and pending transfer 3001 for 100 units. Create resolution 3002 referencing 3001 with void_pending_transfer and zero amount. Neither posted counter should change.",
        "starter": "create_transfers id=3002 pending_id=3001 amount=100 flags=post_pending_transfer;\n",
        "solution": "create_transfers id=3002 pending_id=3001 flags=void_pending_transfer;\n",
        "setup": [
          "create_accounts id=101 ledger=700 code=10, id=102 ledger=700 code=10;",
          "create_transfers id=3001 debit_account_id=101 credit_account_id=102 amount=100 ledger=700 code=10 flags=pending;"
        ],
        "checks": [
          {
            "name": "debit counters returned to zero",
            "command": "lookup_accounts id=101;",
            "expect": [
              {
                "debits_pending": "0",
                "debits_posted": "0"
              }
            ]
          },
          {
            "name": "credit counters returned to zero",
            "command": "lookup_accounts id=102;",
            "expect": [
              {
                "credits_pending": "0",
                "credits_posted": "0"
              }
            ]
          },
          {
            "name": "separate void record",
            "command": "lookup_transfers id=3002;",
            "expect": [
              {
                "pending_id": "3001",
                "flags": "void_pending_transfer"
              }
            ]
          }
        ],
        "tests": "• debit counters returned to zero\n• credit counters returned to zero\n• separate void record",
        "hints": [
          "Switch from post_pending_transfer to void_pending_transfer.",
          "Omit amount to use zero. The pending_id identifies the reservation to release."
        ],
        "references": [
          {
            "title": "two-phase-transfers.md",
            "url": "https://github.com/tigerbeetle/tigerbeetle/blob/cc1c06a924e49b11089c521b2209d34c92caaf18/docs/coding/two-phase-transfers.md"
          }
        ]
      },
      {
        "id": "tb-quiz-pending",
        "title": "Checkpoint: pending",
        "kind": "quiz",
        "minutes": 8,
        "description": "Explain the model, then check your understanding. Retry freely.",
        "questions": [
          {
            "prompt": "Posting 60 of a pending 100 leaves how much reserved?",
            "options": [
              "40",
              "100",
              "0"
            ],
            "answer": 2,
            "explanation": "Partial posting resolves the original reservation and releases the unused 40."
          },
          {
            "prompt": "Does posting mutate the original pending transfer record?",
            "options": [
              "Yes, its pending flag is removed",
              "No, it creates a new record referencing pending_id",
              "Yes, its ID changes"
            ],
            "answer": 1,
            "explanation": "Transfers are immutable. Separate resolution records describe the later action."
          },
          {
            "prompt": "In this release, post_pending_transfer amount=0 means:",
            "options": [
              "Post zero",
              "Post the entire reservation",
              "Wait until timeout"
            ],
            "answer": 0,
            "explanation": "The old zero-means-all behavior is version-dependent. Modern clients use AMOUNT_MAX for the full pending amount."
          },
          {
            "prompt": "A pending timeout is specified as:",
            "options": [
              "Unix nanoseconds",
              "An absolute date string",
              "A relative number of seconds"
            ],
            "answer": 2,
            "explanation": "The database assigns timestamps and applies the relative timeout interval."
          }
        ]
      }
    ]
  },
  {
    "id": "tb-query",
    "title": "Read and reconcile",
    "description": "Inspect histories and test cross-account invariants.",
    "icon": "06",
    "trackId": "tigerbeetle",
    "lessons": [
      {
        "id": "tb-query-theory",
        "title": "Queries are bounded views",
        "kind": "reading",
        "minutes": 12,
        "description": "A useful audit trail needs more than the current balance.",
        "body": "## Lookups and history\nlookup_accounts and lookup_transfers fetch known IDs. get_account_transfers filters by account and direction. get_account_balances returns historical balances only when history was enabled on the account at creation. A limit is mandatory; empty results may also indicate invalid filter constraints, so validate your filters.\n\n## Pagination\nResults have a stable timestamp order. Timestamp minimum and maximum bounds are inclusive. To page forward without repeating a record, advance from the previous last timestamp carefully, handling the timestamp domain limit. Use reversed for descending order and adjust the opposite bound. Page limits are bounded by the protocol; do not assume a hard-coded size from an old example.\n\n## Reconciliation\nAcross a complete, consistent set of accounts in one ledger, posted debits should equal posted credits. Do not compare a subset that omits clearing or fee accounts, or sum different asset units. A sequence of independent read requests is not automatically one consistent snapshot. Define your reconciliation boundary and time semantics.\n\n## Work artifact\nCreate a report that states ledger, asset scale, time boundary, account coverage, and how pagination avoids duplicate records. Discuss how you would detect a missing external business record as well as an internal imbalance.",
        "references": [
          {
            "title": "get_account_transfers.md",
            "url": "https://github.com/tigerbeetle/tigerbeetle/blob/cc1c06a924e49b11089c521b2209d34c92caaf18/docs/reference/requests/get_account_transfers.md"
          },
          {
            "title": "get_account_balances.md",
            "url": "https://github.com/tigerbeetle/tigerbeetle/blob/cc1c06a924e49b11089c521b2209d34c92caaf18/docs/reference/requests/get_account_balances.md"
          },
          {
            "title": "account-filter.md",
            "url": "https://github.com/tigerbeetle/tigerbeetle/blob/cc1c06a924e49b11089c521b2209d34c92caaf18/docs/reference/account-filter.md"
          }
        ],
        "sourceKeys": []
      },
      {
        "id": "tb-history",
        "title": "Lab: inspect transfers and balances",
        "kind": "exercise",
        "engine": "tigerbeetle",
        "minutes": 20,
        "description": "Read the real history API with an explicit account filter.",
        "body": "## Local lab contract\nEach run formats a fresh single-replica development cluster, applies the stated fixture, runs each semicolon-terminated REPL command, verifies real database state, and removes the data file. These labs do not connect to an existing database. Single-replica development mode does not demonstrate production fault tolerance.",
        "task": "Fixture: source 101 and history-enabled wallet 102 on ledger 700. Transfer 4001 credits the wallet with 100; 4002 debits it by 20. Query get_account_transfers AND get_account_balances for account_id=102, flags=debits|credits, limit=10. Both directions are required.",
        "starter": "get_account_transfers account_id=102 flags=credits limit=10;\nget_account_balances account_id=102 flags=credits limit=10;\n",
        "solution": "get_account_transfers account_id=102 flags=debits|credits limit=10;\nget_account_balances account_id=102 flags=debits|credits limit=10;\n",
        "setup": [
          "create_accounts id=101 ledger=700 code=10, id=102 ledger=700 code=10 flags=history;",
          "create_transfers id=4001 debit_account_id=101 credit_account_id=102 amount=100 ledger=700 code=10;",
          "create_transfers id=4002 debit_account_id=102 credit_account_id=101 amount=20 ledger=700 code=10;"
        ],
        "checks": [
          {
            "name": "both transfer directions observed",
            "expect": [
              {
                "id": "4001"
              },
              {
                "id": "4002"
              }
            ],
            "operation": "get_account_transfers",
            "count": 2
          },
          {
            "name": "both historical balance states observed",
            "expect": [
              {
                "debits_posted": "0",
                "credits_posted": "100"
              },
              {
                "debits_posted": "20",
                "credits_posted": "100"
              }
            ],
            "operation": "get_account_balances",
            "count": 2
          }
        ],
        "tests": "• both transfer directions observed\n• both historical balance states observed",
        "hints": [
          "Use both direction flags separated by |.",
          "History was already enabled in the fixture. You need both API commands."
        ],
        "references": [
          {
            "title": "account-filter.md",
            "url": "https://github.com/tigerbeetle/tigerbeetle/blob/cc1c06a924e49b11089c521b2209d34c92caaf18/docs/reference/account-filter.md"
          },
          {
            "title": "get_account_balances.md",
            "url": "https://github.com/tigerbeetle/tigerbeetle/blob/cc1c06a924e49b11089c521b2209d34c92caaf18/docs/reference/requests/get_account_balances.md"
          }
        ]
      },
      {
        "id": "tb-reconcile",
        "title": "Zig model: reconcile a complete ledger",
        "kind": "exercise",
        "engine": "zig",
        "minutes": 20,
        "description": "Check equality without silently overflowing the totals.",
        "body": "This is an educational Zig model inspired by the project, compiled with the foundations compiler (0.17.0). It is not imported TigerBeetle production code; the pinned upstream source uses Zig 0.14.1.",
        "task": "Implement `reconciled(accounts: []const Totals) !bool`, where Totals has debits: u128 and credits: u128. Return whether sums match. Return error.Overflow if either accumulated sum exceeds u128. Empty input is balanced.",
        "starter": "pub const Totals = struct { debits: u128, credits: u128 };\npub fn reconciled(accounts: []const Totals) !bool {\n    return accounts.len == 0;\n}\n",
        "solution": "pub const Totals = struct { debits: u128, credits: u128 };\npub fn reconciled(accounts: []const Totals) !bool {\n    var debits: u128 = 0;\n    var credits: u128 = 0;\n    for (accounts) |account| {\n        const debit_sum = @addWithOverflow(debits, account.debits);\n        const credit_sum = @addWithOverflow(credits, account.credits);\n        if (debit_sum[1] != 0) return error.Overflow;\n        if (credit_sum[1] != 0) return error.Overflow;\n        debits = debit_sum[0];\n        credits = credit_sum[0];\n    }\n    return debits == credits;\n}\n",
        "tests": "test \"complete and incomplete totals\" {\n    try std.testing.expect(try learner.reconciled(&.{}));\n    try std.testing.expect(try learner.reconciled(&.{ .{ .debits = 100, .credits = 0 }, .{ .debits = 0, .credits = 100 } }));\n    try std.testing.expect(!try learner.reconciled(&.{ .{ .debits = 100, .credits = 99 } }));\n    try std.testing.expectError(error.Overflow, learner.reconciled(&.{ .{ .debits = std.math.maxInt(u128), .credits = 0 }, .{ .debits = 1, .credits = 0 } }));\n    try std.testing.expectError(error.Overflow, learner.reconciled(&.{ .{ .debits = 0, .credits = std.math.maxInt(u128) }, .{ .debits = 0, .credits = 1 } }));\n}\n",
        "hints": [
          "@addWithOverflow returns a tuple containing the result and an overflow bit.",
          "Check both overflow bits before updating either running total."
        ],
        "references": [
          {
            "title": "state_machine.zig",
            "url": "https://github.com/tigerbeetle/tigerbeetle/blob/cc1c06a924e49b11089c521b2209d34c92caaf18/src/state_machine.zig"
          }
        ],
        "sourceKeys": []
      },
      {
        "id": "tb-quiz-query",
        "title": "Checkpoint: query",
        "kind": "quiz",
        "minutes": 8,
        "description": "Explain the model, then check your understanding. Retry freely.",
        "questions": [
          {
            "prompt": "Historical account balances require:",
            "options": [
              "The history flag at account creation",
              "A negative transfer",
              "A new SQL index"
            ],
            "answer": 0,
            "explanation": "Historical balances are enabled by the immutable account history flag."
          },
          {
            "prompt": "Timestamp pagination bounds are:",
            "options": [
              "Always exclusive",
              "Inclusive",
              "Randomly ordered"
            ],
            "answer": 1,
            "explanation": "An inclusive bound can repeat the previous boundary record unless the next-page cursor advances correctly."
          },
          {
            "prompt": "Why can an incomplete account subset appear unbalanced?",
            "options": [
              "Double entry is optional",
              "The transfer protocol drops credits",
              "The opposite entry can be on an omitted account"
            ],
            "answer": 2,
            "explanation": "Reconciliation must include all relevant accounts and a well-defined read boundary."
          },
          {
            "prompt": "Can you sum USD cents and EUR cents into one meaningful balance?",
            "options": [
              "Yes, both are integers",
              "No; reconcile each ledger and asset unit separately",
              "Only when account IDs differ"
            ],
            "answer": 1,
            "explanation": "Arithmetic equality does not make different asset units interchangeable."
          }
        ]
      }
    ]
  },
  {
    "id": "tb-integration",
    "title": "Build a reliable wallet flow",
    "description": "Compose holds, fees, retries, and corrections.",
    "icon": "07",
    "trackId": "tigerbeetle",
    "lessons": [
      {
        "id": "tb-integration-theory",
        "title": "The database is part of the workflow",
        "kind": "reading",
        "minutes": 12,
        "description": "A reliable integration preserves business intent across system boundaries.",
        "body": "## Durable intent and outcomes\nPersist intent before submission. Maintain the same ID and canonical payload on retries. Store enough context to investigate a conflicting duplicate. When the API returns a normal business rejection, surface the reason rather than creating a new ID and hoping the next attempt succeeds.\n\n## Corrections are new events\nA posted transfer cannot be edited or deleted. A refund or correction is a new transfer with a new ID and an application-level association to the original business event, often via user_data fields and your metadata database. A correction can itself fail if the account policy no longer permits it.\n\n## SDK boundary\nThe REPL exposes the same account/transfer primitives used by official clients. For your team’s chosen SDK, practice its lifecycle, exact u128 representation, batch limits, per-event results, and teardown. Client connectivity is not a distributed transaction with your other database. Design explicit recovery and reconciliation around that boundary.\n\n## Capstone review\nExplain the sequence, the account normal balances, the atomic fee relationship, and every retry ID. Then recreate the recipe with your team’s official SDK. Review the client README at this pinned commit before copying result-handling code from elsewhere.",
        "references": [
          {
            "title": "README.md",
            "url": "https://github.com/tigerbeetle/tigerbeetle/blob/cc1c06a924e49b11089c521b2209d34c92caaf18/src/clients/node/README.md"
          },
          {
            "title": "system-architecture.md",
            "url": "https://github.com/tigerbeetle/tigerbeetle/blob/cc1c06a924e49b11089c521b2209d34c92caaf18/docs/coding/system-architecture.md"
          },
          {
            "title": "correcting-transfers.md",
            "url": "https://github.com/tigerbeetle/tigerbeetle/blob/cc1c06a924e49b11089c521b2209d34c92caaf18/docs/coding/recipes/correcting-transfers.md"
          }
        ],
        "sourceKeys": []
      },
      {
        "id": "tb-wallet",
        "title": "Capstone: authorize, pay, refund",
        "kind": "exercise",
        "engine": "tigerbeetle",
        "minutes": 20,
        "description": "Build a multi-step wallet workflow with observable outcomes.",
        "body": "## Local lab contract\nEach run formats a fresh single-replica development cluster, applies the stated fixture, runs each semicolon-terminated REPL command, verifies real database state, and removes the data file. These labs do not connect to an existing database. Single-replica development mode does not demonstrate production fault tolerance.\n\nA repeated linked batch can report exists for one event and linked_event_failed for the rest. Confirm the original records and compare their payloads; do not convert a chain-level result into an unverified success.",
        "task": "Fixture: clearing 1, Alice 2, Bob 3, fee account 4 on ledger 700, code 10. Alice/Bob enforce debits_must_not_exceed_credits. Transfer 900 funds Alice with 500. Create pending 5001 from Alice to Bob for 120; post 100 with resolution 5002. In one linked batch, create 5003 Alice→Bob for 40 and 5004 Alice→fees for 5 (only 5003 linked). Retry that exact two-event batch, then use lookup_transfers for IDs 5003 and 5004 to confirm the original payloads. An exists result can stop a linked replay, leaving linked_event_failed for the other member. Refund 10 Bob→Alice with ID 5005. Final Alice: credits 510/debits 145, Bob: credits 140/debits 10, fees: credits 5; no pending amounts. Use ledger 700/code 10 for ordinary transfers.",
        "starter": "create_transfers id=5001 debit_account_id=2 credit_account_id=3 amount=120 ledger=700 code=10 flags=pending;\n",
        "solution": "create_transfers id=5001 debit_account_id=2 credit_account_id=3 amount=120 ledger=700 code=10 flags=pending;\ncreate_transfers id=5002 pending_id=5001 amount=100 flags=post_pending_transfer;\ncreate_transfers id=5003 debit_account_id=2 credit_account_id=3 amount=40 ledger=700 code=10 flags=linked, id=5004 debit_account_id=2 credit_account_id=4 amount=5 ledger=700 code=10;\ncreate_transfers id=5003 debit_account_id=2 credit_account_id=3 amount=40 ledger=700 code=10 flags=linked, id=5004 debit_account_id=2 credit_account_id=4 amount=5 ledger=700 code=10;\ncreate_transfers id=5005 debit_account_id=3 credit_account_id=2 amount=10 ledger=700 code=10;\nlookup_transfers id=5003,id=5004;\n",
        "setup": [
          "create_accounts id=1 ledger=700 code=10, id=2 ledger=700 code=10 flags=debits_must_not_exceed_credits, id=3 ledger=700 code=10 flags=debits_must_not_exceed_credits, id=4 ledger=700 code=10;",
          "create_transfers id=900 debit_account_id=1 credit_account_id=2 amount=500 ledger=700 code=10;"
        ],
        "checks": [
          {
            "name": "Alice settled correctly",
            "command": "lookup_accounts id=2;",
            "expect": [
              {
                "credits_posted": "510",
                "debits_posted": "145",
                "debits_pending": "0"
              }
            ]
          },
          {
            "name": "Bob received and refunded correctly",
            "command": "lookup_accounts id=3;",
            "expect": [
              {
                "credits_posted": "140",
                "debits_posted": "10",
                "credits_pending": "0"
              }
            ]
          },
          {
            "name": "one fee effect",
            "command": "lookup_accounts id=4;",
            "expect": [
              {
                "credits_posted": "5"
              }
            ]
          },
          {
            "name": "all intended records retained",
            "command": "lookup_transfers id=5001,id=5002,id=5003,id=5004,id=5005;",
            "count": 5
          },
          {
            "name": "linked replay found an existing event",
            "status": "exists"
          },
          {
            "name": "remaining linked replay member reported chain failure",
            "status": "linked_event_failed"
          },
          {
            "name": "original payment and fee payloads inspected",
            "operation": "lookup_transfers",
            "count": 2,
            "expect": [
              {
                "id": "5003",
                "debit_account_id": "2",
                "credit_account_id": "3",
                "amount": "40"
              },
              {
                "id": "5004",
                "debit_account_id": "2",
                "credit_account_id": "4",
                "amount": "5"
              }
            ]
          }
        ],
        "tests": "• Alice settled correctly\n• Bob received and refunded correctly\n• one fee effect\n• all intended records retained\n• linked replay found an existing event\n• remaining linked replay member reported chain failure\n• original payment and fee payloads inspected",
        "hints": [
          "Do the reservation and its resolution first. A partial post releases the unused 20.",
          "Link payment and fee in one comma-separated request. Retry the same two IDs and flags, then create a new reverse-direction refund."
        ],
        "references": [
          {
            "title": "two-phase-transfers.md",
            "url": "https://github.com/tigerbeetle/tigerbeetle/blob/cc1c06a924e49b11089c521b2209d34c92caaf18/docs/coding/two-phase-transfers.md"
          },
          {
            "title": "linked-events.md",
            "url": "https://github.com/tigerbeetle/tigerbeetle/blob/cc1c06a924e49b11089c521b2209d34c92caaf18/docs/coding/linked-events.md"
          },
          {
            "title": "correcting-transfers.md",
            "url": "https://github.com/tigerbeetle/tigerbeetle/blob/cc1c06a924e49b11089c521b2209d34c92caaf18/docs/coding/recipes/correcting-transfers.md"
          }
        ]
      },
      {
        "id": "tb-result-policy",
        "title": "Zig model: classify outcomes",
        "kind": "exercise",
        "engine": "zig",
        "minutes": 20,
        "description": "Make retry policy explicit with exhaustive enums.",
        "body": "This is an educational Zig model inspired by the project, compiled with the foundations compiler (0.17.0). It is not imported TigerBeetle production code; the pinned upstream source uses Zig 0.14.1.",
        "task": "Implement `classify(status: Status) Action`. created/exists → confirmed; timeout → retry_same_id; exists_with_different_amount → conflict; exceeds_credits → rejected. These are selected teaching cases, not the complete SDK error set.",
        "starter": "pub const Status = enum { created, exists, timeout, exists_with_different_amount, exceeds_credits };\npub const Action = enum { confirmed, retry_same_id, conflict, rejected };\npub fn classify(status: Status) Action {\n    _ = status;\n    return .retry_same_id;\n}\n",
        "solution": "pub const Status = enum { created, exists, timeout, exists_with_different_amount, exceeds_credits };\npub const Action = enum { confirmed, retry_same_id, conflict, rejected };\npub fn classify(status: Status) Action {\n    return switch (status) {\n        .created, .exists => .confirmed,\n        .timeout => .retry_same_id,\n        .exists_with_different_amount => .conflict,\n        .exceeds_credits => .rejected,\n    };\n}\n",
        "tests": "test \"explicit result policy\" {\n    try std.testing.expectEqual(learner.Action.confirmed, learner.classify(.created));\n    try std.testing.expectEqual(learner.Action.confirmed, learner.classify(.exists));\n    try std.testing.expectEqual(learner.Action.retry_same_id, learner.classify(.timeout));\n    try std.testing.expectEqual(learner.Action.conflict, learner.classify(.exists_with_different_amount));\n    try std.testing.expectEqual(learner.Action.rejected, learner.classify(.exceeds_credits));\n}\n",
        "hints": [
          "Use an exhaustive switch so each selected status has a policy.",
          "A transport timeout is ambiguous. A business rejection or payload conflict needs a different action."
        ],
        "references": [
          {
            "title": "reliable-transaction-submission.md",
            "url": "https://github.com/tigerbeetle/tigerbeetle/blob/cc1c06a924e49b11089c521b2209d34c92caaf18/docs/coding/reliable-transaction-submission.md"
          }
        ],
        "sourceKeys": []
      },
      {
        "id": "tb-quiz-integration",
        "title": "Checkpoint: integration",
        "kind": "quiz",
        "minutes": 8,
        "description": "Explain the model, then check your understanding. Retry freely.",
        "questions": [
          {
            "prompt": "How should you correct a committed transfer?",
            "options": [
              "Edit its amount",
              "Create a new correcting transfer with a new ID",
              "Delete the record"
            ],
            "answer": 1,
            "explanation": "Committed transfers are immutable. Corrections are explicit new economic events."
          },
          {
            "prompt": "A payment and fee must either both happen or neither. Use:",
            "options": [
              "Linked events in one request",
              "Two unrelated requests",
              "The same ID for both transfers"
            ],
            "answer": 0,
            "explanation": "Linked events couple the outcomes while preserving a unique ID for each event."
          },
          {
            "prompt": "A timeout should usually cause the model to:",
            "options": [
              "Confirm without checking",
              "Generate a new ID",
              "Retry the same persisted intent"
            ],
            "answer": 2,
            "explanation": "A timeout does not tell you whether the original event committed."
          },
          {
            "prompt": "Does a TigerBeetle request atomically commit your metadata database too?",
            "options": [
              "Always",
              "No; design an explicit cross-system workflow",
              "Only in development mode"
            ],
            "answer": 1,
            "explanation": "The application must coordinate durable intent, results, and reconciliation across systems."
          },
          {
            "prompt": "A replayed linked batch reports exists followed by linked_event_failed. What should you do?",
            "options": [
              "Automatically assume every intended payload matched",
              "Generate new transfer IDs for the whole batch",
              "Look up the original records and compare each with the persisted intent"
            ],
            "answer": 2,
            "explanation": "Linked replay results are not one independent confirmation per event. Verify all original IDs and economic fields before confirming the complete group."
          }
        ]
      }
    ]
  },
  {
    "id": "tb-source",
    "title": "Find your way around the source",
    "description": "Trace module ownership, layout, and bounded state.",
    "icon": "08",
    "trackId": "tigerbeetle",
    "lessons": [
      {
        "id": "tb-source-theory",
        "title": "Read a database as a set of contracts",
        "kind": "reading",
        "minutes": 12,
        "description": "Start with data definitions and follow the transitions that preserve their invariants.",
        "body": "## A reading order\nsrc/tigerbeetle.zig defines Account, Transfer, flags, and result enums. src/state_machine.zig validates and applies accounting operations. src/vsr/replica.zig coordinates replicated ordering. src/lsm contains the persistent trees; src/vsr contains journal and superblock machinery. src/vopr.zig and src/testing provide simulation infrastructure.\n\n## Zig features to recognize\nextern structs define exact interop layouts, packed structs give flags explicit bit positions, and comptime checks enforce sizes and alignments. Generic factories return specialized types. Operations progress through explicit state and completion callbacks. Platform-specific IO is selected from the build target. The Zig foundations course now has dedicated TigerStyle and codebase-pattern chapters for these features.\n\n## Allocation discipline\nThe system derives resource limits and allocates during startup. The event loop then reuses bounded buffers and queues. This is not a claim that every buffer is a compile-time global or that a startup allocator is never used. Bounds make latency, overload, and resource ownership easier to reason about.\n\n## Read with evidence\nFor every function, identify its caller, preconditions, state it changes, callback/lifetime rules, and a test exercising a boundary. Before proposing a change, state the invariant you expect the test to protect.",
        "references": [
          {
            "title": "ARCHITECTURE.md",
            "url": "https://github.com/tigerbeetle/tigerbeetle/blob/cc1c06a924e49b11089c521b2209d34c92caaf18/docs/ARCHITECTURE.md"
          },
          {
            "title": "TIGER_STYLE.md",
            "url": "https://github.com/tigerbeetle/tigerbeetle/blob/cc1c06a924e49b11089c521b2209d34c92caaf18/docs/TIGER_STYLE.md"
          },
          {
            "title": "tigerbeetle.zig",
            "url": "https://github.com/tigerbeetle/tigerbeetle/blob/cc1c06a924e49b11089c521b2209d34c92caaf18/src/tigerbeetle.zig"
          }
        ],
        "sourceKeys": [
          "account",
          "state-machine",
          "io"
        ]
      },
      {
        "id": "tb-source-map",
        "title": "Source lab: locate the responsibilities",
        "kind": "exercise",
        "engine": "source",
        "minutes": 25,
        "description": "Navigate actual source, then submit a small map.",
        "body": "Use the source buttons to read local excerpts from the pinned checkout. Follow the upstream links when you need the full file. The checker confirms both your submitted paths and the presence of the relevant declarations in those actual files.\n\nDistinguish the public data layout from the accounting transition logic, replication protocol, LSM storage, and deterministic simulator. A source map gives you starting points; reading callers, tests, and contracts gives you understanding.",
        "task": "Fill the JSON paths for account_definition, state_machine, replication, storage, and simulation. All values must be repository-relative paths at this pinned commit.",
        "starter": "{\n  \"account_definition\": \"\",\n  \"state_machine\": \"\",\n  \"replication\": \"\",\n  \"storage\": \"\",\n  \"simulation\": \"\"\n}",
        "solution": "{\n  \"account_definition\": \"src/tigerbeetle.zig\",\n  \"state_machine\": \"src/state_machine.zig\",\n  \"replication\": \"src/vsr/replica.zig\",\n  \"storage\": \"src/lsm/tree.zig\",\n  \"simulation\": \"src/vopr.zig\"\n}",
        "sourceAnswers": {
          "account_definition": [
            "src/tigerbeetle.zig",
            "pub const Account = extern struct"
          ],
          "state_machine": [
            "src/state_machine.zig",
            "pub fn commit("
          ],
          "replication": [
            "src/vsr/replica.zig",
            "fn on_request("
          ],
          "storage": [
            "src/lsm/tree.zig",
            "pub fn TreeType("
          ],
          "simulation": [
            "src/vopr.zig",
            ""
          ]
        },
        "tests": "Locate the public account ABI, accounting transition function, VSR replica, LSM tree, and simulator in the actual pinned checkout.",
        "hints": [
          "Look at the source excerpt filenames, not just the type names.",
          "Data layout lives in src/tigerbeetle.zig; accounting logic lives in src/state_machine.zig."
        ],
        "sourceKeys": [
          "account",
          "state-machine",
          "replica",
          "lsm",
          "vopr"
        ],
        "references": [
          {
            "title": "ARCHITECTURE.md",
            "url": "https://github.com/tigerbeetle/tigerbeetle/blob/cc1c06a924e49b11089c521b2209d34c92caaf18/docs/ARCHITECTURE.md"
          },
          {
            "title": "HACKING.md",
            "url": "https://github.com/tigerbeetle/tigerbeetle/blob/cc1c06a924e49b11089c521b2209d34c92caaf18/docs/internals/HACKING.md"
          }
        ]
      },
      {
        "id": "tb-account-layout",
        "title": "Zig model: reproduce an ABI layout",
        "kind": "exercise",
        "engine": "zig",
        "minutes": 20,
        "description": "A wire/storage layout is a contract, not an accidental field order.",
        "body": "This is an educational Zig model inspired by the project, compiled with the foundations compiler (0.17.0). It is not imported TigerBeetle production code; the pinned upstream source uses Zig 0.14.1.",
        "task": "Using the Account excerpt, reproduce an extern Account with the same field order and widths. Use u16 for flags in this layout-only exercise. Required size is 128, alignment 16, ledger offset 112, timestamp offset 120 and type u64. Include reserved: u32 before ledger.",
        "starter": "pub const Account = extern struct {\n    id: u128,\n    debits_pending: u128,\n    debits_posted: u128,\n    credits_pending: u128,\n    credits_posted: u128,\n    user_data_128: u128,\n    user_data_64: u64,\n    user_data_32: u32,\n    ledger: u32,\n    code: u16,\n    flags: u16,\n    timestamp: u64,\n};\n",
        "solution": "pub const Account = extern struct {\n    id: u128,\n    debits_pending: u128,\n    debits_posted: u128,\n    credits_pending: u128,\n    credits_posted: u128,\n    user_data_128: u128,\n    user_data_64: u64,\n    user_data_32: u32,\n    reserved: u32,\n    ledger: u32,\n    code: u16,\n    flags: u16,\n    timestamp: u64,\n};\n",
        "tests": "test \"account layout contract\" {\n    try std.testing.expectEqual(@as(usize, 128), @sizeOf(learner.Account));\n    try std.testing.expectEqual(@as(usize, 16), @alignOf(learner.Account));\n    try std.testing.expectEqual(@as(usize, 112), @offsetOf(learner.Account, \"ledger\"));\n    try std.testing.expectEqual(@as(usize, 120), @offsetOf(learner.Account, \"timestamp\"));\n    try std.testing.expect(@FieldType(learner.Account, \"timestamp\") == u64);\n    try std.testing.expect(@FieldType(learner.Account, \"reserved\") == u32);\n}\n",
        "hints": [
          "Compare every field, including reserved fields, against the actual definition.",
          "The missing reserved: u32 belongs between user_data_32 and ledger."
        ],
        "references": [
          {
            "title": "tigerbeetle.zig",
            "url": "https://github.com/tigerbeetle/tigerbeetle/blob/cc1c06a924e49b11089c521b2209d34c92caaf18/src/tigerbeetle.zig"
          }
        ],
        "sourceKeys": [
          "account"
        ]
      },
      {
        "id": "tb-quiz-source",
        "title": "Checkpoint: source",
        "kind": "quiz",
        "minutes": 8,
        "description": "Explain the model, then check your understanding. Retry freely.",
        "questions": [
          {
            "prompt": "Which file defines Account and Transfer layouts?",
            "options": [
              "src/tigerbeetle.zig",
              "src/vopr.zig",
              "README.md"
            ],
            "answer": 0,
            "explanation": "The public accounting data definitions live in src/tigerbeetle.zig at the pinned commit."
          },
          {
            "prompt": "Why use comptime size/alignment assertions?",
            "options": [
              "To replace all runtime tests",
              "To catch ABI drift during compilation",
              "To allocate on every request"
            ],
            "answer": 1,
            "explanation": "Binary-layout mistakes can be rejected before an executable is produced."
          },
          {
            "prompt": "What does startup allocation discipline mean here?",
            "options": [
              "No allocator is ever called",
              "All storage lives in global variables",
              "Resources are allocated up front and reused within derived limits"
            ],
            "answer": 2,
            "explanation": "The important boundary is initialization versus the main event loop, with explicit limits."
          },
          {
            "prompt": "A callback-based operation requires you to understand:",
            "options": [
              "Only its function name",
              "The completion lifetime and state transitions",
              "Only the number of comments"
            ],
            "answer": 1,
            "explanation": "Buffers, completions, and their owning objects must remain valid for the operation’s entire lifetime."
          }
        ]
      }
    ]
  },
  {
    "id": "tb-vsr",
    "title": "Order, replicate, recover",
    "description": "Separate consensus, accounting, and local persistence.",
    "icon": "09",
    "trackId": "tigerbeetle",
    "lessons": [
      {
        "id": "tb-vsr-theory",
        "title": "From a request to durable ordered state",
        "kind": "reading",
        "minutes": 12,
        "description": "Determinism lets replicas apply the same ordered operations to the same state.",
        "body": "## Normal path\nThe primary assigns ordering, writes a prepare to the journal/WAL, and replicates it. Backups persist prepares and acknowledge them. A replication quorum permits commit. The accounting state machine applies committed operations in order. The full protocol handles more than this happy path, including duplicate replies, view changes, repair, and state synchronization.\n\n## Quorums are not all the same\nFor the documented six-replica configuration, normal progress with a live primary needs three healthy replicas; electing a replacement primary needs four. Do not apply a generic majority formula to every TigerBeetle protocol phase. The exercise below is a small availability model of those documented thresholds, not an implementation of VSR.\n\n## WAL, trees, and checkpoints\nThe journal/WAL preserves ordered operations. The LSM forest stores derived state and indexes. A durable checkpoint advances a recovery boundary through superblock metadata; subsequent committed operations can be replayed. Checksummed redundant replicas also support corruption repair. Restarting a single healthy local file demonstrates much less than production repair.\n\n## Investigate\nTrace one operation from on_request through prepare acknowledgements into state-machine commit. Then explain where ordering, business validation, and physical durability are separate responsibilities.",
        "references": [
          {
            "title": "ARCHITECTURE.md",
            "url": "https://github.com/tigerbeetle/tigerbeetle/blob/cc1c06a924e49b11089c521b2209d34c92caaf18/docs/ARCHITECTURE.md"
          },
          {
            "title": "vsr.md",
            "url": "https://github.com/tigerbeetle/tigerbeetle/blob/cc1c06a924e49b11089c521b2209d34c92caaf18/docs/internals/vsr.md"
          },
          {
            "title": "lsm.md",
            "url": "https://github.com/tigerbeetle/tigerbeetle/blob/cc1c06a924e49b11089c521b2209d34c92caaf18/docs/internals/lsm.md"
          },
          {
            "title": "cluster.md",
            "url": "https://github.com/tigerbeetle/tigerbeetle/blob/cc1c06a924e49b11089c521b2209d34c92caaf18/docs/operating/cluster.md"
          }
        ],
        "sourceKeys": [
          "replica",
          "prepare-ok",
          "superblock",
          "lsm"
        ]
      },
      {
        "id": "tb-request-trace",
        "title": "Source lab: follow a request",
        "kind": "exercise",
        "engine": "source",
        "minutes": 30,
        "description": "Match protocol stages to their real handler names.",
        "body": "Read the request, prepare-acknowledgement, and accounting-commit excerpts. A client request is ordered and replicated before the accounting state machine applies the committed operation. The code has additional paths for retransmission, repair, synchronization, and view changes; this exercise traces only the normal-path entry points.",
        "task": "Fill JSON with client_request (VSR handler name), replication_ack (VSR handler name), and accounting_commit (state-machine method name). Use bare function names, without parentheses.",
        "starter": "{\n  \"client_request\": \"\",\n  \"replication_ack\": \"\",\n  \"accounting_commit\": \"\"\n}",
        "solution": "{\n  \"client_request\": \"on_request\",\n  \"replication_ack\": \"on_prepare_ok\",\n  \"accounting_commit\": \"commit\"\n}",
        "sourceAnswers": {
          "client_request": [
            "src/vsr/replica.zig",
            "fn on_request(",
            "on_request"
          ],
          "replication_ack": [
            "src/vsr/replica.zig",
            "fn on_prepare_ok(",
            "on_prepare_ok"
          ],
          "accounting_commit": [
            "src/state_machine.zig",
            "pub fn commit(",
            "commit"
          ]
        },
        "tests": "Verify the request, prepare acknowledgement, and accounting commit handlers against the pinned source.",
        "hints": [
          "Protocol handlers in Replica use an on_ prefix.",
          "A prepare acknowledgement is called prepare_ok in VSR."
        ],
        "sourceKeys": [
          "replica",
          "prepare-ok",
          "state-machine"
        ],
        "references": [
          {
            "title": "ARCHITECTURE.md",
            "url": "https://github.com/tigerbeetle/tigerbeetle/blob/cc1c06a924e49b11089c521b2209d34c92caaf18/docs/ARCHITECTURE.md"
          },
          {
            "title": "vsr.md",
            "url": "https://github.com/tigerbeetle/tigerbeetle/blob/cc1c06a924e49b11089c521b2209d34c92caaf18/docs/internals/vsr.md"
          }
        ]
      },
      {
        "id": "tb-quorums",
        "title": "Zig model: six-replica availability",
        "kind": "exercise",
        "engine": "zig",
        "minutes": 20,
        "description": "Different protocol phases can have different thresholds.",
        "body": "This is an educational Zig model inspired by the project, compiled with the foundations compiler (0.17.0). It is not imported TigerBeetle production code; the pinned upstream source uses Zig 0.14.1.",
        "task": "Implement `can_serve(healthy: u8, primary_alive: bool) bool` for this documented six-replica model. A live primary needs at least 3 healthy replicas. Replacing it needs at least 4. Counts above 6 are invalid and return false. This does not simulate partitions or protocol state.",
        "starter": "pub fn can_serve(healthy: u8, primary_alive: bool) bool {\n    _ = primary_alive;\n    return healthy >= 4;\n}\n",
        "solution": "pub fn can_serve(healthy: u8, primary_alive: bool) bool {\n    if (healthy > 6) return false;\n    if (primary_alive) return healthy >= 3;\n    return healthy >= 4;\n}\n",
        "tests": "test \"documented thresholds\" {\n    try std.testing.expect(learner.can_serve(3, true));\n    try std.testing.expect(!learner.can_serve(2, true));\n    try std.testing.expect(!learner.can_serve(3, false));\n    try std.testing.expect(learner.can_serve(4, false));\n    try std.testing.expect(learner.can_serve(6, true));\n    try std.testing.expect(!learner.can_serve(7, true));\n    try std.testing.expect(!learner.can_serve(0, false));\n}\n",
        "hints": [
          "Validate the healthy count before choosing the threshold.",
          "The primary_alive branch uses 3; the replacement-election branch uses 4."
        ],
        "references": [
          {
            "title": "cluster.md",
            "url": "https://github.com/tigerbeetle/tigerbeetle/blob/cc1c06a924e49b11089c521b2209d34c92caaf18/docs/operating/cluster.md"
          }
        ],
        "sourceKeys": []
      },
      {
        "id": "tb-quiz-vsr",
        "title": "Checkpoint: vsr",
        "kind": "quiz",
        "minutes": 8,
        "description": "Explain the model, then check your understanding. Retry freely.",
        "questions": [
          {
            "prompt": "What does deterministic state-machine execution require?",
            "options": [
              "Each replica chooses its own order",
              "The same starting state and ordered inputs produce the same next state",
              "Clock reads inside every transition"
            ],
            "answer": 1,
            "explanation": "Determinism makes agreement on the operation order useful for replicated state."
          },
          {
            "prompt": "For the documented six-replica configuration, replacing the primary needs:",
            "options": [
              "Two replicas",
              "Three replicas",
              "Four replicas"
            ],
            "answer": 2,
            "explanation": "View-change and normal replication thresholds differ. The model uses the documented six-replica values."
          },
          {
            "prompt": "Which component stores ordered prepares for recovery?",
            "options": [
              "The WAL/journal",
              "The account code field",
              "The web application cache"
            ],
            "answer": 0,
            "explanation": "The journal/WAL and derived LSM state have different roles in persistence and recovery."
          },
          {
            "prompt": "Does restarting one development replica prove disk-corruption tolerance?",
            "options": [
              "Yes, completely",
              "No; independent redundancy and repair are not tested",
              "Only if it uses port 3000"
            ],
            "answer": 1,
            "explanation": "A local restart is useful but does not exercise a distributed cluster’s fault and repair guarantees."
          }
        ]
      }
    ]
  },
  {
    "id": "tb-testing-ops",
    "title": "Test, recover, contribute",
    "description": "Reproducible failures, real builds, and operational limits.",
    "icon": "10",
    "trackId": "tigerbeetle",
    "lessons": [
      {
        "id": "tb-testing-theory",
        "title": "Evidence beyond the happy path",
        "kind": "reading",
        "minutes": 12,
        "description": "A passing example is the beginning of confidence, not the end.",
        "body": "## Deterministic simulation\nVOPR runs real system logic against simulated infrastructure, injecting failures under a seed. Reproducing a failure requires the code revision and relevant configuration as well as the seed. Logical time, simulated storage, and deterministic scheduling make fault sequences repeatable. A small replay loop is useful for learning but is not equivalent to VOPR.\n\n## Work on the real project\nThe installed checkout is pinned; its compiler is Zig 0.14.1. Run ./zig/zig build check for a compile check, and ./zig/zig build test:unit -- sum_overflows for a focused upstream test. Full test/CI/simulation commands can take substantially longer and may need additional resources. Read the pinned HACKING document before running a new suite. The course does not launch an unlimited VOPR run in the browser.\n\n## Operations\nA data file plus process is a replica. Production replicas need independent disks and machines; six processes on your laptop are not six independent fault domains. Monitor health, latency, storage and capacity, and rehearse documented upgrades and recovery on a disposable cluster. Follow version compatibility and the current operational docs; never experiment on production data.\n\n## A practical mastery review\nBring your team a working SDK version of the wallet capstone, a source map, a normal-path request trace, a new boundary test in a separate clone, and a short incident/recovery exercise. Be able to explain which properties your tests establish and which they do not. Revisit the official project docs before changing a real deployment.",
        "references": [
          {
            "title": "HACKING.md",
            "url": "https://github.com/tigerbeetle/tigerbeetle/blob/cc1c06a924e49b11089c521b2209d34c92caaf18/docs/internals/HACKING.md"
          },
          {
            "title": "vopr.md",
            "url": "https://github.com/tigerbeetle/tigerbeetle/blob/cc1c06a924e49b11089c521b2209d34c92caaf18/docs/internals/vopr.md"
          },
          {
            "title": "TIGER_STYLE.md",
            "url": "https://github.com/tigerbeetle/tigerbeetle/blob/cc1c06a924e49b11089c521b2209d34c92caaf18/docs/TIGER_STYLE.md"
          },
          {
            "title": "cluster.md",
            "url": "https://github.com/tigerbeetle/tigerbeetle/blob/cc1c06a924e49b11089c521b2209d34c92caaf18/docs/operating/cluster.md"
          },
          {
            "title": "upgrading.md",
            "url": "https://github.com/tigerbeetle/tigerbeetle/blob/cc1c06a924e49b11089c521b2209d34c92caaf18/docs/operating/upgrading.md"
          }
        ],
        "sourceKeys": [
          "vopr",
          "storage",
          "tiger-style",
          "build"
        ]
      },
      {
        "id": "tb-replay",
        "title": "Zig model: bounded idempotent replay",
        "kind": "exercise",
        "engine": "zig",
        "minutes": 20,
        "description": "Replay a small sequence deterministically with explicit bounds.",
        "body": "This is an educational Zig model inspired by the project, compiled with the foundations compiler (0.17.0). It is not imported TigerBeetle production code; the pinned upstream source uses Zig 0.14.1.",
        "task": "Implement replay over at most 64 Entry values. Sum each unique ID once; identical duplicate ID/amount pairs are ignored. A reused ID with another amount returns error.Conflict. ID zero returns error.InvalidId. More than 64 entries returns error.TooMany. The bounded O(n²) search is intentional for this teaching model; it is not the production database algorithm.",
        "starter": "pub const Entry = struct { id: u128, amount: u64 };\npub fn replay(entries: []const Entry) !u128 {\n    return entries.len;\n}\n",
        "solution": "pub const Entry = struct { id: u128, amount: u64 };\npub fn replay(entries: []const Entry) !u128 {\n    if (entries.len > 64) return error.TooMany;\n    var total: u128 = 0;\n    for (entries, 0..) |entry, index| {\n        if (entry.id == 0) return error.InvalidId;\n        var duplicate = false;\n        for (entries[0..index]) |previous| {\n            if (previous.id == entry.id) {\n                if (previous.amount != entry.amount) return error.Conflict;\n                duplicate = true;\n            }\n        }\n        if (!duplicate) total += entry.amount;\n    }\n    return total;\n}\n",
        "tests": "test \"deterministic replay and conflicts\" {\n    const entries = [_]learner.Entry{ .{ .id = 1, .amount = 10 }, .{ .id = 2, .amount = 7 }, .{ .id = 1, .amount = 10 } };\n    try std.testing.expectEqual(@as(u128, 17), try learner.replay(&entries));\n    try std.testing.expectEqual(@as(u128, 17), try learner.replay(&entries));\n    try std.testing.expectEqual(@as(u128, 0), try learner.replay(&.{}));\n    try std.testing.expectError(error.InvalidId, learner.replay(&.{ .{ .id = 0, .amount = 1 } }));\n    try std.testing.expectError(error.Conflict, learner.replay(&.{ .{ .id = 1, .amount = 1 }, .{ .id = 1, .amount = 2 } }));\n    const too_many: [65]learner.Entry = @splat(.{ .id = 1, .amount = 1 });\n    try std.testing.expectError(error.TooMany, learner.replay(&too_many));\n}\n",
        "hints": [
          "Scan only entries before the current index when looking for duplicates.",
          "Validate the length first, reject zero IDs, and compare amount whenever an earlier ID matches."
        ],
        "references": [
          {
            "title": "vopr.md",
            "url": "https://github.com/tigerbeetle/tigerbeetle/blob/cc1c06a924e49b11089c521b2209d34c92caaf18/docs/internals/vopr.md"
          },
          {
            "title": "TIGER_STYLE.md",
            "url": "https://github.com/tigerbeetle/tigerbeetle/blob/cc1c06a924e49b11089c521b2209d34c92caaf18/docs/TIGER_STYLE.md"
          }
        ],
        "sourceKeys": []
      },
      {
        "id": "tb-restart",
        "title": "Lab: survive a replica restart",
        "kind": "exercise",
        "engine": "tigerbeetle",
        "minutes": 20,
        "description": "Verify committed state after killing and reopening a real replica.",
        "body": "## Local lab contract\nEach run formats a fresh single-replica development cluster, applies the stated fixture, runs each semicolon-terminated REPL command, verifies real database state, and removes the data file. These labs do not connect to an existing database. Single-replica development mode does not demonstrate production fault tolerance.",
        "task": "Fixture: accounts 101/102 on ledger 700, code 10. Create transfer 6001 for 77 units from 101 to 102. After your commands complete, the harness kills the replica and starts it again with the same data file, then verifies the transfer and counters. This demonstrates a local healthy-disk restart, not distributed failure recovery.",
        "starter": "create_transfers id=6001 debit_account_id=101 credit_account_id=102 amount=7 ledger=700 code=10;\n",
        "solution": "create_transfers id=6001 debit_account_id=101 credit_account_id=102 amount=77 ledger=700 code=10;\n",
        "setup": [
          "create_accounts id=101 ledger=700 code=10, id=102 ledger=700 code=10;"
        ],
        "checks": [
          {
            "name": "committed transfer survived restart",
            "command": "lookup_transfers id=6001;",
            "expect": [
              {
                "id": "6001",
                "amount": "77"
              }
            ],
            "count": 1
          },
          {
            "name": "debit state recovered",
            "command": "lookup_accounts id=101;",
            "expect": [
              {
                "debits_posted": "77"
              }
            ]
          },
          {
            "name": "credit state recovered",
            "command": "lookup_accounts id=102;",
            "expect": [
              {
                "credits_posted": "77"
              }
            ]
          }
        ],
        "tests": "• committed transfer survived restart\n• debit state recovered\n• credit state recovered",
        "hints": [
          "Use the exact amount 77. The harness performs the restart for you.",
          "The record and both account counters must still agree after reopening the same file."
        ],
        "references": [
          {
            "title": "start.md",
            "url": "https://github.com/tigerbeetle/tigerbeetle/blob/cc1c06a924e49b11089c521b2209d34c92caaf18/docs/start.md"
          },
          {
            "title": "data_file.md",
            "url": "https://github.com/tigerbeetle/tigerbeetle/blob/cc1c06a924e49b11089c521b2209d34c92caaf18/docs/internals/data_file.md"
          }
        ],
        "restart": true
      },
      {
        "id": "tb-upstream-test",
        "title": "Source lab: compile and run a real upstream test",
        "kind": "exercise",
        "engine": "upstream",
        "minutes": 30,
        "description": "Move from a teaching model into the actual TigerBeetle project.",
        "body": "The pinned source has a real sum_overflows unit test in src/state_machine.zig. Submit the exact build step and filter in the JSON below. The runner invokes the source checkout’s Zig 0.14.1, compiles the selected upstream unit test, and requires that the test actually ran. This uses no student-provided shell commands. A cold build can take a few minutes; the UI waits for the result.\n\nAfterward, use a separate working clone for your own changes: locate the helper, add a meaningful boundary test, run the narrow filter, then the broader checks recommended by the project. Do not submit a behavior change without explaining its invariant and reproducer.",
        "task": "Set build_step to test:unit and filter to sum_overflows. Check solution will compile and execute that real upstream test. The source checkout and compiler must be installed with npm run setup:tigerbeetle.",
        "starter": "{\n  \"build_step\": \"test\",\n  \"filter\": \"\"\n}",
        "solution": "{\n  \"build_step\": \"test:unit\",\n  \"filter\": \"sum_overflows\"\n}",
        "tests": "Run the pinned upstream test:unit build step with filter sum_overflows, require a successful build, and require at least one passing upstream test.",
        "hints": [
          "The narrow build step is test:unit.",
          "The actual test declaration is named sum_overflows in src/state_machine.zig."
        ],
        "sourceKeys": [
          "sum-overflows",
          "build"
        ],
        "references": [
          {
            "title": "HACKING.md",
            "url": "https://github.com/tigerbeetle/tigerbeetle/blob/cc1c06a924e49b11089c521b2209d34c92caaf18/docs/internals/HACKING.md"
          },
          {
            "title": "state_machine.zig",
            "url": "https://github.com/tigerbeetle/tigerbeetle/blob/cc1c06a924e49b11089c521b2209d34c92caaf18/src/state_machine.zig"
          },
          {
            "title": "build.zig",
            "url": "https://github.com/tigerbeetle/tigerbeetle/blob/cc1c06a924e49b11089c521b2209d34c92caaf18/build.zig"
          }
        ]
      },
      {
        "id": "tb-quiz-testing-operations",
        "title": "Checkpoint: testing operations",
        "kind": "quiz",
        "minutes": 8,
        "description": "Explain the model, then check your understanding. Retry freely.",
        "questions": [
          {
            "prompt": "What belongs in a deterministic simulator reproducer?",
            "options": [
              "Only the seed, forever",
              "Revision, seed, and relevant configuration",
              "Only the elapsed wall time"
            ],
            "answer": 1,
            "explanation": "The same seed with changed code or configuration can exercise a different execution."
          },
          {
            "prompt": "Which compiler should build the pinned upstream source?",
            "options": [
              "Whatever zig is on PATH",
              "The foundations compiler automatically",
              "The checkout’s Zig 0.14.1"
            ],
            "answer": 2,
            "explanation": "The project enforces its own compiler version. The two course environments are deliberately separate."
          },
          {
            "prompt": "Are six local processes six independent production fault domains?",
            "options": [
              "No, they share host and storage risks",
              "Yes, different ports are sufficient",
              "Yes, if the files have different names"
            ],
            "answer": 0,
            "explanation": "Production isolation requires independent disks/machines and considered site placement, not just process count."
          },
          {
            "prompt": "What is the strongest next step after the course checks pass?",
            "options": [
              "Assume every distributed failure is covered",
              "Review a new boundary test and recovery exercise with your team",
              "Delete the source checkout"
            ],
            "answer": 1,
            "explanation": "Explain your evidence and its limits, then practice project-specific changes with review and broader validation."
          }
        ]
      }
    ]
  }
];
