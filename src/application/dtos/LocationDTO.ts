import { Location } from '../../domain/entities/Location';

/** Location output DTO (public representation, serializable as JSON). */
export interface LocationDTO {
  id: string;
  code: string;
  description: string | null;
  active: boolean;
}

export function toLocationDTO(location: Location): LocationDTO {
  return {
    id: location.id,
    code: location.code,
    description: location.description,
    active: location.active,
  };
}
