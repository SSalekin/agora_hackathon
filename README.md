# Team GRRC (Greenwich Recon & Research Club)

## Proect Name: NestFind
### Smart Apartment Allocator


Currently finding a suitable apartment to rent is a very tedious task in Vietnam.
Often, people need to search through various Zalo groups or ask for help from agents, which is tedious and time consuming.

Even after the user finds an apartment listing, the details are often vague, and the user has no way to verify the credibility or reputation of the landlord.

This often raises quite a few problems:

#### Problem 1:
People have to search through listings in zalo. If the person is an expat and can not speak or read Vietnamese language, that is another extra layer of difficulty

#### Problem 2:
No good way to verify the reputation of the Landlord. People have to go through the deal solely relying on their gut feeling.

#### Problem 3:
No safe way to deposit the money to the Landlord

Example: Landlord asks "To reserve the room, send me 5 million VND deposit."

Good outcome:
```
Tenant arrives.
Apartment exists.
Tenant moves in.
Everything is fine.
```

#### Bad outcome #1:
```
Landlord disappears.
Tenant loses 5 million VND.
```

#### Bad outcome #2:
```
Apartment exists. But

Photos were fake.
Room is much smaller.
Different location.

Landlord claims "Deposits are non-refundable"
```

#### Bad outcome #3:
```
Landlord rents it to someone else.

Tenant has to go through finding apartment process from the beginning.
Which will be more troublesome.

Landlord might also return the deposit late, or in extreme cases not return at all.
```

#### Bad outcome #4:
```
Person promises to pay the deposit to the landlord.
But he delays in paying the landlord and keeps making excuses.
```

## How we want to tackle this issue

The project will be a extremely simple Website + App ( We will use PWA ).

* User signs in, communicates with the Agora Convo AI about his need.

* The AI will ask him for additional details if necessary ( how many square meters, does he have pets, what's the budget )

* From the listing User can see the reputation of the landlord ( Calculated via Solana )

```
★★★★★ 4.8

Completed rentals: 37
Deposit return rate: 97%
Disputes lost: 0
Landlord stake: 500 USDC
```

* User pays the deposit money to an escrow account (Solana Escrow)

Example workflow:

```
User deposits:
100 TEST TOKENS

Escrow Status:
Locked

Property Verified:
Yes

User arrives:
Accept / Reject

    Accept:
    Funds released

    Reject:
    Funds refunded
```


Instead of sending money directly to landlord:

```
User → Escrow Account → Landlord
```
The money sits in the middle.
Neither party controls it.

#### Without escrow:
Need to involve Banks, Police and Lawyers

### Conclusion
Moving apartments are already a hassle by itself, The goal of our project is to  lower the stress caused by it and make the finding and renting apartments easier than current solutions.

## Couchbase listing catalog

NestFind uses the local demo catalog when Couchbase is not configured. To move the demo listings into Couchbase Capella, configure the `COUCHBASE_*` variables, create the configured collection, then run:

```bash
pnpm run check:couchbase
pnpm run seed:couchbase
pnpm run dev
```

See [docs/COUCHBASE.md](docs/COUCHBASE.md) for the complete setup and safety notes.
