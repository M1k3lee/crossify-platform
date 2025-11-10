# BSC Factory Address Fix

## The Issue

The BSC Factory address in Netlify has a typo in the last few characters.

## Current (WRONG)
```
0xFF8c690B5b65905da20D8de87Cd6298c223a4086
                                     ^^^^
                                     Last 4 chars: 4086 (number 8)
```

## Correct (RIGHT)
```
0xFF8c690B5b65905da20D8de87Cd6298c223a40B6
                                     ^^^^
                                     Last 4 chars: 40B6 (letter B)
```

## Exact Difference

- **Position**: Third character from the end
- **Current**: `8` (the number eight)
- **Correct**: `B` (the letter B, uppercase)

## Visual Comparison

```
WRONG: 0xFF8c690B5b65905da20D8de87Cd6298c223a4086
RIGHT: 0xFF8c690B5b65905da20D8de87Cd6298c223a40B6
                                          ^
                                    This character changes
```

## How to Fix

1. Go to Netlify Environment Variables
2. Find `VITE_BSC_FACTORY`
3. Click to edit
4. Change the last part from `...4086` to `...40B6`
5. Make sure you're changing the `8` to a `B` (letter B, not number 8)
6. Save and trigger a new deploy

## Verification

After updating, the address should end with: `40B6` (not `4086`)

The correct full address is:
```
0xFF8c690B5b65905da20D8de87Cd6298c223a40B6
```

