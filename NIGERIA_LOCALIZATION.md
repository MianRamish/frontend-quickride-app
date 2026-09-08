# QuickRide Nigeria Frontend Localization

This frontend copy has been adapted from the Canada/US version for a Nigeria-first launch while keeping the existing backend API routes and data contracts intact.

## Frontend changes made

- Default currency changed from USD/CAD fallbacks to NGN.
- Currency formatting now uses `en-NG` and supports NGN correctly.
- Default/fallback map location changed from Toronto to Lagos (`6.5244, 3.3792`).
- Canada/United States labels replaced with Nigeria/NG.
- Pickup placeholder changed to `Pickup in Nigeria`.
- Driver ride-request distance display changed from miles to kilometres.
- Driver dashboard total distance calculation changed from miles to kilometres.
- Passenger and driver signup phone placeholders use `+234`.
- Profile phone fields use `tel` rather than numeric-only fields so international Nigerian numbers can be entered.
- Canada-specific routing/transit payout wording changed to `Bank code (if required)` while retaining the existing backend property name.
- Visible `Captain` wording was changed to `Driver` where appropriate; internal routes/API names remain `captain` for compatibility.
- Canada/US vehicle restriction message was replaced with a Nigeria city/operating-area configuration note.
- Existing OpenStreetMap/Leaflet implementation is retained.

## Backend work still required for a real Nigerian launch

The uploaded project is frontend-only. The backend should also be updated so the UI receives Nigerian market data rather than only falling back to it.

1. Return `NGN` from fare/market responses.
2. Configure Nigerian base fare, per-kilometre fare, per-minute fare, minimum fare and surge logic.
3. Bias/restrict address suggestions and geocoding to Nigeria where appropriate.
4. Validate and normalize Nigerian phone numbers (`+234`).
5. Decide which vehicle types are enabled per city. The current API contract primarily uses `car` and `bike` fare keys.
6. Configure Nigerian driver verification/document requirements per operating state/city.
7. Replace/manual payout handling with your chosen Nigerian bank/payment provider when ready.
8. Add online card/bank-transfer payments if required; current ride UI still states cash payment for the MVP.

## Compatibility note

Internal API paths and entity names such as `/captain/*`, `captain`, `routingNumber`, and the existing fare object structure were intentionally retained to avoid breaking the current backend.


## Mobile payment UX

- Cash is selected and usable today.
- Card is visible as a disabled `Coming soon` option so the mobile flow will not need a redesign when a gateway is added.
- The passenger confirmation sheet clearly explains that cash is paid directly to the driver.
- The driver completion flow now requires a visible cash-received confirmation before the ride can end.
- Payment cards, safer tap targets, safe-area spacing, and bottom-sheet sizing were refined for phone screens.
