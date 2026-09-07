'use client'

import { useEffect, useRef } from 'react'
import { SelectItem } from '@/lib/heroui'
import { FormSelect, FormRow } from '@/components/ui/FormFields'
import { useFormContext } from 'react-hook-form'
import {
  useGetIndiaStatesQuery,
  useGetIndiaCitiesQuery,
} from '@/redux/services/api'

/**
 * Dependent India state → city picker for react-hook-form forms.
 * Writes UUID fields and keeps display names in optional companion fields.
 */
export function IndiaStateCityFields({
  stateIdField = 'state_id',
  cityIdField = 'city_id',
  cityNameField = 'city',
  stateNameField = 'state_name',
  isRequired = false,
  columns = 2,
}) {
  const { watch, setValue } = useFormContext()
  const stateId = watch(stateIdField)
  const cityId = watch(cityIdField)
  const prevStateRef = useRef(stateId)

  const { data: states = [], isLoading: statesLoading } = useGetIndiaStatesQuery()
  const { data: cities = [], isLoading: citiesLoading } = useGetIndiaCitiesQuery(
    { stateId, limit: 2000 },
    { skip: !stateId }
  )

  useEffect(() => {
    if (prevStateRef.current !== stateId) {
      prevStateRef.current = stateId
      setValue(cityIdField, '')
      if (cityNameField) setValue(cityNameField, '')
    }
    if (!stateId) {
      if (stateNameField) setValue(stateNameField, '')
      return
    }
    const selected = states.find((s) => String(s.id) === String(stateId))
    if (selected && stateNameField) {
      setValue(stateNameField, selected.name)
    }
  }, [
    stateId,
    states,
    setValue,
    cityIdField,
    cityNameField,
    stateNameField,
  ])

  useEffect(() => {
    if (!cityId || !cityNameField) return
    const selected = cities.find((c) => String(c.id) === String(cityId))
    if (selected) {
      setValue(cityNameField, selected.name, { shouldValidate: true })
    }
  }, [cityId, cities, cityNameField, setValue])

  return (
    <FormRow columns={columns}>
      <FormSelect
        name={stateIdField}
        label="State / UT"
        placeholder={statesLoading ? 'Loading…' : 'Select state'}
        isRequired={isRequired}
        isDisabled={statesLoading}
      >
        {states.map((state) => (
          <SelectItem key={state.id} value={state.id} textValue={state.name}>
            {state.name}
          </SelectItem>
        ))}
      </FormSelect>
      <FormSelect
        name={cityIdField}
        label="City"
        placeholder={
          !stateId
            ? 'Select state first'
            : citiesLoading
              ? 'Loading…'
              : 'Select city'
        }
        isRequired={isRequired}
        isDisabled={!stateId || citiesLoading}
      >
        {cities.map((city) => (
          <SelectItem key={city.id} value={city.id} textValue={city.name}>
            {city.name}
          </SelectItem>
        ))}
      </FormSelect>
    </FormRow>
  )
}
