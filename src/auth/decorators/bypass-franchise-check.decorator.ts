import { SetMetadata } from '@nestjs/common';

export const BypassFranchiseCheck = () => SetMetadata('bypassFranchiseCheck', true);
