# tabular3rd

3GPP RAN3 tabular utilities

## Parser

![](https://img.shields.io/badge/support-NGAP-brightgreen)
![](https://img.shields.io/badge/support-XnAP-brightgreen)
![](https://img.shields.io/badge/support-E1AP-brightgreen)
![](https://img.shields.io/badge/support-F1AP-brightgreen)  
![](https://img.shields.io/badge/support-S1AP-brightgreen)
![](https://img.shields.io/badge/support-X2AP-brightgreen)
![](https://img.shields.io/badge/support-W1AP-brightgreen)

Parse RAN3 tabular definitions into JavaScript class objects

```sh
npm install proj3rd/tabular3rd
```

```ts
import { readFileSync } from 'fs';
import { parse } from 'tabular3rd';

const ran3spec = readFileSync('ran3-spec-docx-file');
const parsed = await parse(ran3spec);
```

TBU
