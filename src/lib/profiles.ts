import profilesData from '../data/profiles.json';
import type { CompanyProfile } from '../types';

const profiles = profilesData as CompanyProfile[];

export function getProfileById(id: string): CompanyProfile | undefined {
  return profiles.find(p => p.id === id);
}

export default profiles;
