import React from 'react';
import * as THREE from 'three';
import { WeaponId, normalizeWeaponId } from '../../types/weapons';
import { AR76Vandal } from './models/AR76Vandal';
import { SR99Spectre } from './models/SR99Spectre';
import { SMG9Viper } from './models/SMG9Viper';
import { SG12Breacher } from './models/SG12Breacher';
import { MK4Deagle } from './models/MK4Deagle';
import { K01Karambit } from './models/K01Karambit';

export interface WeaponModelProps {
  weaponId: WeaponId | string;
  isThirdPerson?: boolean;
  reloadProgress?: number;
  recoilProgress?: number;
  muzzleRef?: React.RefObject<THREE.Group>;
  ejectionRef?: React.RefObject<THREE.Group>;
}

export const WeaponModel: React.FC<WeaponModelProps> = ({
  weaponId,
  isThirdPerson = false,
  reloadProgress = 0,
  recoilProgress = 0,
  muzzleRef,
  ejectionRef,
}) => {
  const norm = normalizeWeaponId(weaponId);

  switch (norm) {
    case 'AR':
      return (
        <AR76Vandal
          isThirdPerson={isThirdPerson}
          reloadProgress={reloadProgress}
          recoilProgress={recoilProgress}
          muzzleRef={muzzleRef}
          ejectionRef={ejectionRef}
        />
      );
    case 'SR':
      return (
        <SR99Spectre
          isThirdPerson={isThirdPerson}
          reloadProgress={reloadProgress}
          recoilProgress={recoilProgress}
          muzzleRef={muzzleRef}
          ejectionRef={ejectionRef}
        />
      );
    case 'SMG':
      return (
        <SMG9Viper
          isThirdPerson={isThirdPerson}
          reloadProgress={reloadProgress}
          recoilProgress={recoilProgress}
          muzzleRef={muzzleRef}
          ejectionRef={ejectionRef}
        />
      );
    case 'SG':
      return (
        <SG12Breacher
          isThirdPerson={isThirdPerson}
          reloadProgress={reloadProgress}
          recoilProgress={recoilProgress}
          muzzleRef={muzzleRef}
          ejectionRef={ejectionRef}
        />
      );
    case 'PISTOL':
      return (
        <MK4Deagle
          isThirdPerson={isThirdPerson}
          reloadProgress={reloadProgress}
          recoilProgress={recoilProgress}
          muzzleRef={muzzleRef}
          ejectionRef={ejectionRef}
        />
      );
    case 'KNIFE':
      return (
        <K01Karambit
          isThirdPerson={isThirdPerson}
          reloadProgress={reloadProgress}
          recoilProgress={recoilProgress}
          muzzleRef={muzzleRef}
          ejectionRef={ejectionRef}
        />
      );
    default:
      return null;
  }
};
