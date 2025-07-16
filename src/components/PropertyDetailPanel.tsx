// src/components/PropertyDetailPanel.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import type { PropertyWithClient } from '@/generated-types/customTypes';

interface PropertyDetailPanelProps {
  property: PropertyWithClient; // The property object to display
  onClose: () => void; // Function to call when the panel should close
}

export default function PropertyDetailPanel({ property, onClose }: PropertyDetailPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null); // Ref to detect clicks outside the panel

  // NEW: handleSyncIcal function - place this inside the component function, before the return()
  const handleSyncIcal = async (propertyId: number, platformUserId: string) => {
    alert('Syncing iCals... This may take a moment.');

    try {
      // Step 1: Fetch all active iCals for the property
      const icalResponse = await fetch(`/api/property/${propertyId}/icals`);
      if (!icalResponse.ok) {
        const err = await icalResponse.json();
        throw new Error(err.error || 'Failed to fetch iCals');
      }

      const { icals } = await icalResponse.json();
      if (!icals || icals.length === 0) {
        alert('No active iCal links found for this property.');
        return;
      }

      // Step 2: Loop and sync each iCal
      for (const ical of icals) {
        try {
          const response = await fetch('/api/sync-ical', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ical_url: ical.url,
              property_id: propertyId,
              platform_user_id: platformUserId,
            }),
          });

          // Defensive parsing
          let data;
            try {
              data = await response.json();
            } catch {
              const text = await response.text();
              console.error('❌ Response is not valid JSON. Text content:', text);
              alert('iCal sync failed: Response was not JSON. See console.');
              continue;
            }

          if (!response.ok) {
            console.error('❌ API returned error:', data.error);
            alert(`Failed to sync iCal (${ical.url}): ${data.error || 'Unknown error'}`);
          } else {
            console.log('✅ Synced iCal:', ical.url);
          }
        } catch (error) {
          console.error('❌ Sync failed with exception:', error);
          alert(`Exception during iCal sync: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      // Step 3: Generate cleaning tasks once after syncing all
      const taskResponse = await fetch('/api/generate-cleaning-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ property_id: propertyId }),
      });

      if (!taskResponse.ok) {
        const errData = await taskResponse.json();
        console.error('Cleaning task generation failed:', errData?.error);
        alert('iCals synced, but task generation failed.');
      } else {
        const taskData = await taskResponse.json();
        console.log('Tasks generated:', taskData.message);
        alert('iCals synced and tasks generated successfully!');
      }
    } catch (error) {
      const err = error as Error;
      alert('An error occurred during iCal sync: ' + err.message);
      console.error('iCal sync client error:', err);
    }
  };



  useEffect(() => {
    // Function to handle clicks outside the panel
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose(); // Close the panel if click is outside
      }
    };

    // Add event listener for mousedown (fires before click, good for outside clicks)
    document.addEventListener('mousedown', handleClickOutside);

    // Clean up the event listener when the component unmounts
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]); // Depend on onClose to re-create listener if it changes

  // Helper to render a section title
  const SectionTitle: React.FC<{ title: string }> = ({ title }) => (
    <h4 className="text-md font-semibold text-gray-800 mt-4 mb-2 border-b pb-1">
      {title}
    </h4>
  );

  // Helper to render a detail row
  const DetailRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => {
    if (
      value === null ||
      value === undefined ||
      value === '' ||
      (typeof value === 'number' && value === 0)
    )
      return null;

    return (
      <p className="text-sm text-gray-700 mb-1">
        <span className="font-medium">{label}:</span> {value}
      </p>
    );
  };

    // CORRECTED: Helper to check if a section should be displayed (e.g., if any of its values are non-empty)
    const isSectionNotEmpty = (values: (string | number | boolean | null | undefined)[]) => {
        return values.some(val => {
            // For boolean values, only consider 'false' as empty for section display purposes
            if (typeof val === 'boolean') {
                return val === true; // If it's a true boolean, the section is not empty
            }
            // For others, check for null, undefined, empty string, or zero
            return val !== null && val !== undefined && String(val).trim() !== '' && !(typeof val === 'number' && val === 0);
        });
    };

  const [hasIcal, setHasIcal] = useState(false);

  useEffect(() => {
    async function checkIcal() {
      const res = await fetch(`/api/property/${property.id}/has-ical`);
      if (res.ok) {
        const { hasIcal: result } = await res.json();
        setHasIcal(result);
      }
    }

    checkIcal();
  }, [property.id]);

  return (
    <div
      ref={panelRef} // Attach ref to the panel div
      className="fixed right-0 top-0 h-full w-[650px] bg-white shadow-xl flex flex-col z-50 overflow-y-auto p-6 border-l border-gray-200"
      // w-[400px] sets the fixed width, z-50 ensures it's above other content
    >
      {/* Close Button */}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-200 transition-colors"
      >
        ✖
      </button>

      <h2 className="text-2xl font-bold text-blue-800 mb-4 pr-10">
        {property.client_property_nickname || property.short_address}
      </h2>
      
      {/* MAIN INFO Section */}
      <SectionTitle title="MAIN INFO" />
      <DetailRow label="Status" value={property.status} />
      <DetailRow label="ID" value={property.id} />
      <DetailRow label="Address" value={property.short_address} />
      {property.client_property_nickname && (
        <DetailRow label="Nickname" value={property.client_property_nickname} />
      )}
      <DetailRow label="City" value={property.cities?.name} />
      <DetailRow label="Suburb" value={property.suburbs?.name} />
      <DetailRow label="Client Name" value={property.clients?.display_name} />
      <DetailRow label="Client ID" value={property.client_id} />

      {/* ACCESS Section */}
      <SectionTitle title="ACCESS" />
      <DetailRow label="HSK Key/TAG" value={property.hsk_key_tag} />
      <DetailRow label="Key Comments" value={property.key_comments} />
      <DetailRow label="Access Info" value={property.access_info} />
      <DetailRow label="Parking Info" value={property.parking_info} />
      <DetailRow label="2nd Keys" value={property.has_second_keyset} /> {/* Display as text */}
      <DetailRow label="Key Situation Cleaner" value={property.key_situation_cleaner} />

      {/* PROPERTY SPECIFICS Section (Conditionally displayed) */}
      {isSectionNotEmpty([property.property_specifics, property.property_specifics_link, property.property_service_types?.name]) && (
        <>
          <SectionTitle title="PROPERTY SPECIFICS" />
          <DetailRow label="Specifics" value={property.property_specifics} />
          <DetailRow label="Specifics Link" value={property.property_specifics_link} />
          <DetailRow label="Service Type" value={property.property_service_types?.name || 'N/A'} />          
        </>
      )}

      {/* FINANCIAL Section */}
      <SectionTitle title="FINANCIAL" />
      <DetailRow label="Hours per Service" value={property.hours_per_service} />
      <DetailRow label="Cleaning (exc. GST)" value={property.cleaning_exc_gst} />
      <DetailRow label="Linen (exc. GST)" value={property.linen_exc_gst} />
      <DetailRow label="Consumables (exc. GST)" value={property.consumables_exc_gst} />
      <DetailRow label="Hourly Rate" value={property.property_hourly_rate} />
      <DetailRow label="Bonus Amount" value={property.bonus_amount} />
      <DetailRow label="Bonus Description" value={property.bonus_description} />

      {/* CONFIGURATION Section */}
      <SectionTitle title="CONFIGURATION" />
      <DetailRow label="Bedrooms" value={property.bedrooms} />
      <DetailRow label="Bathrooms" value={property.bathrooms} />
      <DetailRow label="Pillow Cases" value={property.pillow_cases} />
      <DetailRow label="King Beds" value={property.king_beds} />
      <DetailRow label="Queen Beds" value={property.queen_beds} />
      <DetailRow label="Single Beds" value={property.single_beds} />
      <DetailRow label="King Satin Top" value={property.king_satin_top} />
      <DetailRow label="King Sheets" value={property.king_sheets} />
      <DetailRow label="Queen Satin Top" value={property.queen_satin_top} />
      <DetailRow label="Queen Sheets" value={property.queen_sheets} />
      <DetailRow label="Single Satin Top" value={property.single_satin_top} />
      <DetailRow label="Single Sheets" value={property.single_sheets} />
      <DetailRow label="Bath Towels" value={property.bath_towels} />
      <DetailRow label="Pool Towels" value={property.pool_towels} />
      <DetailRow label="Hand Towels" value={property.hand_towels} />
      <DetailRow label="Bath Mats" value={property.bath_mats} />
      <DetailRow label="Face Washers" value={property.face_washers} />
      <DetailRow label="Tea Towels" value={property.tea_towels} />
      <DetailRow label="Consumables Info" value={property.consumables_info} />

      {/* OTHER Section */}
      <SectionTitle title="OTHER" />
      {property.property_icals && property.property_icals.length > 0 && (
        <>
          <SectionTitle title="iCal Links" />
          {property.property_icals.map((ical, index) => (
            <DetailRow
              key={index}
              label={`iCal Link ${index + 1}`}
              value={
                <a
                  href={ical.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  {ical.url}
                </a>
              }
            />
          ))}
        </>
      )}
      <DetailRow label="Airbnb Link" value={property.airbnb_link} />
      {property.default_cleaner && (
        <DetailRow label="Default Cleaner" value={property.default_cleaner} />
      )}
      <DetailRow label="General Comments" value={property.general_comments} />
      <DetailRow label="Comments for Clients" value={property.comments_for_clients} />
          {/* NEW: Sync iCal Button - place it here within the OTHER section */}
          {hasIcal && (
            <button
              type="button"
              onClick={() => handleSyncIcal(property.id, property.platform_user_id)}
              className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-blue-600 transition-colors text-sm"
            >
              Sync iCal
            </button>
          )}

      {/* HAS Section (Show only if any of the booleans are true) */}
      {isSectionNotEmpty([property.wine, property.bbq, property.pool, property.coffee_maker, property.dishwasher, property.washer, property.dryer]) && (
        <>
          <SectionTitle title="HAS" />
          <div className="text-sm text-gray-700 mb-1">
            {property.wine && <span className="mr-2 px-2 py-1 bg-green-100 rounded-full">Wine</span>}
            {property.bbq && <span className="mr-2 px-2 py-1 bg-green-100 rounded-full">BBQ</span>}
            {property.pool && <span className="mr-2 px-2 py-1 bg-green-100 rounded-full">Pool</span>}
            {property.coffee_maker && <span className="mr-2 px-2 py-1 bg-green-100 rounded-full">Coffee Maker</span>}
            {property.dishwasher && <span className="mr-2 px-2 py-1 bg-green-100 rounded-full">Dishwasher</span>}
            {property.washer && <span className="mr-2 px-2 py-1 bg-green-100 rounded-full">Washer</span>}
            {property.dryer && <span className="mr-2 px-2 py-1 bg-green-100 rounded-full">Dryer</span>}
          </div>
        </>
      )}

    </div>
  );
}