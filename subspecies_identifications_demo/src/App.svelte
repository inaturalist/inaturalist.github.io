<script lang="ts">
  let observationId = '';
  let observation: any = null;
  let loading = false;
  let error = '';
  let taxonSearchQuery = '';
  let taxonSearchResults: any[] = [];
  let selectedTaxon: any = null;
  let showTaxonDropdown = false;
  let demoIdentifications: any[] = [];
  let showAlgorithmModal = false;
  let demoIdCounter = 0;
  let showDisagreementModal = false;
  let pendingIdentification: any = null;
  let showNeedsIdVotesModal = false;
  let needsIdVotesModalType: 'yes' | 'no' | null = null;
  let demoVoteCounter = 0;
  let demoVotes: any[] = [];
  let mode: 'current' | 'alternative' = 'current';
  let showObserverDropdown = false;
  let showSurveyModal = false;
  let showTutorialModal = false;
  let votesDisabled = false;
  let observationTaxon: any = null;
  let observationTaxonUpdateCounter = 0;
  let previousCommunityTaxonId: number | null = null;

  const emojis = ['😊', '🙂', '😎', '🤓', '😀', '🤗', '😃', '😄', '🙃', '😁', '😺', '🐱', '🦊', '🐶', '🐼', '🐨', '🦁', '🐯', '🐸', '🐝'];

  function getRandomEmoji() {
    return emojis[Math.floor(Math.random() * emojis.length)];
  }

  // Function to update URL with current demo state
  function updateURL() {
    if (!observation || (observation.id !== 0 && observation.id !== -1)) return;
    if (demoIdentifications.length === 0 && demoVotes.length === 0 && mode === 'current') return;

    const params = new URLSearchParams();
    params.set('obs', observation.id.toString());

    if (mode !== 'current') {
      params.set('mode', mode);
    }

    // Encode demo identifications: taxonId:userLetter:emoji:disagreement
    if (demoIdentifications.length > 0) {
      const idsParam = demoIdentifications.map(id => {
        const userLetter = id.user.login.replace('Person', '');
        const emoji = id.user.emoji || '';
        const disagreement = id.disagreement ? '1' : '0';
        return `${id.taxon.id}:${userLetter}:${encodeURIComponent(emoji)}:${disagreement}`;
      }).join('|');
      params.set('ids', idsParam);
    }

    // Encode demo votes: flag:userLetter:emoji
    if (demoVotes.length > 0) {
      const votesParam = demoVotes.map(vote => {
        const userLetter = vote.user.login.replace('User', '');
        const emoji = vote.user.emoji || '';
        const flag = vote.vote_flag ? '1' : '0';
        return `${flag}:${userLetter}:${encodeURIComponent(emoji)}`;
      }).join('|');
      params.set('votes', votesParam);
    }

    const newURL = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, '', newURL);
  }

  // Function to load state from URL
  async function loadStateFromURL() {
    const params = new URLSearchParams(window.location.search);
    const obsParam = params.get('obs');

    if (!obsParam) return;

    observationId = obsParam;

    // Set mode
    const modeParam = params.get('mode');
    if (modeParam === 'alternative') {
      mode = 'alternative';
    }

    // Fetch the observation first
    await fetchObservation();

    // Clear the input field after loading from URL
    observationId = '';

    // Load demo identifications
    const idsParam = params.get('ids');
    if (idsParam && observation) {
      const idEntries = idsParam.split('|');
      for (const entry of idEntries) {
        const [taxonId, userLetter, encodedEmoji, disagreement] = entry.split(':');

        // Fetch taxon details
        try {
          const response = await fetch(`https://api.inaturalist.org/v1/taxa/${taxonId}`);
          const data = await response.json();
          if (data.results && data.results.length > 0) {
            const taxon = data.results[0];
            const emoji = decodeURIComponent(encodedEmoji);

            const newId = {
              id: `demo-${Date.now()}-${Math.random()}`,
              user: {
                id: userLetter === '0' ? -1 : -(userLetter.charCodeAt(0)),  // Assign unique negative ID
                login: `Person${userLetter}`,
                icon: null,
                emoji: emoji
              },
              taxon: taxon,
              current: true,
              created_at: new Date().toISOString(),
              disagreement: disagreement === '1',
              previous_observation_taxon: disagreement === '1' ? observation.taxon : null
            };

            demoIdentifications = [...demoIdentifications, newId];
            demoIdCounter++;

            // Small delay to ensure unique timestamps
            await new Promise(resolve => setTimeout(resolve, 10));
          }
        } catch (e) {
          console.error(`Failed to load taxon ${taxonId}:`, e);
        }
      }
    }

    // Load demo votes
    const votesParam = params.get('votes');
    if (votesParam && observation) {
      const voteEntries = votesParam.split('|');
      for (const entry of voteEntries) {
        const [flag, userLetter, encodedEmoji] = entry.split(':');
        const emoji = decodeURIComponent(encodedEmoji);

        const newVote = {
          id: `demo-vote-${Date.now()}-${Math.random()}`,
          user: {
            login: `User${userLetter}`,
            icon: null,
            emoji: emoji
          },
          vote_scope: 'needs_id',
          vote_flag: flag === '1',
          created_at: new Date().toISOString()
        };

        demoVotes = [...demoVotes, newVote];
        demoVoteCounter++;

        // Small delay to ensure unique timestamps
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }
  }

  // Load state from URL on mount
  import { onMount } from 'svelte';

  onMount(() => {
    loadStateFromURL();

    // Load Typeform embed script
    const script = document.createElement('script');
    script.src = 'https://embed.typeform.com/next/embed.js';
    script.async = true;
    document.head.appendChild(script);
  });

  function resetApp() {
    // Clear all state
    observationId = '';
    observation = null;
    loading = false;
    error = '';
    taxonSearchQuery = '';
    taxonSearchResults = [];
    selectedTaxon = null;
    showTaxonDropdown = false;
    demoIdentifications = [];
    showAlgorithmModal = false;
    demoIdCounter = 0;
    showDisagreementModal = false;
    pendingIdentification = null;
    showNeedsIdVotesModal = false;
    needsIdVotesModalType = null;
    demoVoteCounter = 0;
    demoVotes = [];
    mode = 'current';
    showObserverDropdown = false;
    showSurveyModal = false;
    showTutorialModal = false;

    // Clear URL
    window.history.replaceState({}, '', window.location.pathname);
  }

  // Initialize Typeform when survey modal opens
  $: if (showSurveyModal && typeof window !== 'undefined') {
    // Wait for script to load and DOM to be ready
    const initTypeform = () => {
      const tf = (window as any).tf;
      if (tf && tf.createWidget) {
        const container = document.querySelector('[data-tf-live="we8cmOvB"]');
        if (container) {
          // Check if already initialized
          if (container.querySelector('iframe')) {
            return;
          }
          // Clear container
          container.innerHTML = '';
          // Create widget with explicit options
          try {
            tf.createWidget('we8cmOvB', {
              container: container,
              height: 700,
              width: '100%',
              opacity: 100,
              hidden: {},
              onReady: () => console.log('Typeform ready'),
              onSubmit: () => console.log('Typeform submitted')
            });
          } catch (e) {
            console.error('Error creating Typeform widget:', e);
          }
        }
      } else {
        // Script not loaded yet, try again
        setTimeout(initTypeform, 200);
      }
    };

    setTimeout(initTypeform, 100);
  }

  async function fetchObservation() {
    if (!observationId.trim()) {
      error = 'Please enter an observation ID';
      return;
    }

    loading = true;
    error = '';
    observation = null;
    // Clear demo identifications and votes when loading a new observation
    demoIdentifications = [];
    demoIdCounter = 0;
    demoVotes = [];
    demoVoteCounter = 0;

    try {
      // Handle special case for observation ID 0 - create a simulated unknown observation
      if (observationId === '0') {
        observation = {
          id: 0,
          uuid: '00000000-0000-0000-0000-000000000000',
          species_guess: null,
          taxon: null,
          quality_grade: 'needs_id',
          identifications: [],
          votes: [],
          observed_on: '2026-01-01',
          observed_on_details: {
            year: 2026,
            month: 1,
            day: 1
          },
          time_observed_at: null,
          observed_time_zone: null,
          created_at: new Date().toISOString(),
          created_at_details: {
            year: new Date().getFullYear(),
            month: new Date().getMonth() + 1,
            day: new Date().getDate()
          },
          created_time_zone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          user: {
            id: 0,
            login: 'Person0',
            icon: null,
            emoji: getRandomEmoji(),
            preferences: {
              prefers_community_taxa: true
            }
          },
          observation_photos: [{
            photo: {
              url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/77105/medium.jpg'
            }
          }],
          sounds: [],
          obscured: false,
          private_geojson: null
        };
        loading = false;
        return;
      }

      // Handle special case for observation ID -1 - create a simulated unknown observation with opted-out user
      if (observationId === '-1') {
        observation = {
          id: -1,
          uuid: '00000000-0000-0000-0000-000000000001',
          species_guess: null,
          taxon: null,
          quality_grade: 'needs_id',
          identifications: [],
          votes: [],
          observed_on: '2026-01-01',
          observed_on_details: {
            year: 2026,
            month: 1,
            day: 1
          },
          time_observed_at: null,
          observed_time_zone: null,
          created_at: new Date().toISOString(),
          created_at_details: {
            year: new Date().getFullYear(),
            month: new Date().getMonth() + 1,
            day: new Date().getDate()
          },
          created_time_zone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          user: {
            id: -1,
            login: 'Person0',
            icon: null,
            emoji: getRandomEmoji(),
            preferences: {
              prefers_community_taxa: false,
              prefers_community_taxon: false
            }
          },
          observation_photos: [{
            photo: {
              url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/77105/medium.jpg'
            }
          }],
          sounds: [],
          obscured: false,
          private_geojson: null
        };
        loading = false;
        return;
      }

      const response = await fetch(`https://api.inaturalist.org/v1/observations/${observationId}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.results && data.results.length > 0) {
        observation = data.results[0];
      } else {
        error = 'Observation not found';
      }
    } catch (e) {
      error = `Error fetching observation: ${e.message}`;
    } finally {
      loading = false;
    }
  }

  function handleSubmit(event: Event) {
    event.preventDefault();
    const idToFetch = observationId;
    fetchObservation();
    // Clear the input field after submission
    observationId = '';
  }

  function getTaxonDisplay(obs: any): string {
    if (!obs.taxon) return 'No taxon identified';
    const commonName = obs.taxon.preferred_common_name;
    const scientificName = obs.taxon.name;

    if (commonName && scientificName) {
      return `${commonName} (${scientificName})`;
    } else if (scientificName) {
      return scientificName;
    } else if (commonName) {
      return commonName;
    }
    return 'No taxon identified';
  }

  function getPhotoUrl(obs: any): string | null {
    if (obs.observation_photos && obs.observation_photos.length > 0) {
      return obs.observation_photos[0].photo.url;
    }
    return null;
  }

  function getQualityGradeDisplay(grade: string): string {
    if (grade === 'research') return 'Research Grade';
    if (grade === 'needs_id') return 'Needs ID';
    if (grade === 'casual') return 'Casual';
    return grade;
  }

  function getTaxonDisplayForId(taxon: any): string {
    if (!taxon) return 'Unknown';
    const commonName = taxon.preferred_common_name;
    const scientificName = taxon.name;

    if (commonName && scientificName) {
      return `${commonName} (${scientificName})`;
    } else if (scientificName) {
      return scientificName;
    } else if (commonName) {
      return commonName;
    }
    return 'Unknown';
  }

  function getSortedIdentifications(obs: any): any[] {
    if (!obs.identifications || obs.identifications.length === 0) {
      return [];
    }
    return [...obs.identifications].sort((a, b) => {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });
  }

  function getIdPhotoUrl(identification: any): string | null {
    if (identification.taxon && identification.taxon.default_photo && identification.taxon.default_photo.url) {
      return identification.taxon.default_photo.url;
    }
    return null;
  }

  async function searchTaxa() {
    if (taxonSearchQuery.length < 2) {
      taxonSearchResults = [];
      showTaxonDropdown = false;
      return;
    }

    try {
      const response = await fetch(`https://api.inaturalist.org/v1/taxa/autocomplete?q=${encodeURIComponent(taxonSearchQuery)}`);
      const data = await response.json();
      taxonSearchResults = data.results || [];
      showTaxonDropdown = true;
    } catch (e) {
      console.error('Error searching taxa:', e);
      taxonSearchResults = [];
    }
  }

  async function selectTaxon(taxon: any) {
    // Fetch full taxon details to ensure we have ancestor_ids
    try {
      const response = await fetch(`https://api.inaturalist.org/v1/taxa/${taxon.id}`);
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        selectedTaxon = data.results[0];
      } else {
        selectedTaxon = taxon;
      }
    } catch (e) {
      console.error('Error fetching full taxon:', e);
      selectedTaxon = taxon;
    }
    taxonSearchQuery = taxon.name;
    showTaxonDropdown = false;
  }

  function submitIdentification() {
    if (!selectedTaxon || !observation) return;

    const personLetter = String.fromCharCode(65 + demoIdCounter); // A, B, C, etc.
    const emoji = getRandomEmoji();

    // Check if this is a disagreement (sibling taxon) or ancestor
    let isDisagreement = false;
    let previousObservationTaxon = null;
    let isAncestor = false;

    if (observation.taxon) {
      // If they're the same taxon, just add the ID without any disagreement logic
      if (selectedTaxon.id === observation.taxon.id) {
        // Same taxon - no disagreement, no ancestor check needed
        isAncestor = false;
        isDisagreement = false;
      } else {
        const selectedAncestors = selectedTaxon.ancestor_ids || [];
        const observationAncestors = observation.taxon.ancestor_ids || [];

        // Check if selected taxon is an ancestor of the observation taxon (but NOT the same taxon)
        const selectedIsAncestor = observationAncestors.includes(selectedTaxon.id);
        const observationIsAncestor = selectedAncestors.includes(observation.taxon.id);

        if (selectedIsAncestor) {
          // Selected taxon is an ancestor - show disagreement modal
          isAncestor = true;
        } else if (!observationIsAncestor) {
          // Different branch - automatic disagreement
          isDisagreement = true;
          previousObservationTaxon = observation.taxon;
        }
      }
    }

    const newId = {
      id: `demo-${Date.now()}`,
      user: {
        id: -(personLetter.charCodeAt(0)),  // Assign unique negative ID based on letter
        login: `Person${personLetter}`,
        icon: null,
        emoji: emoji
      },
      taxon: selectedTaxon,
      current: true,
      created_at: new Date().toISOString(),
      disagreement: isDisagreement,
      previous_observation_taxon: previousObservationTaxon
    };

    if (isAncestor) {
      // Show modal for potential disagreement
      pendingIdentification = newId;
      showDisagreementModal = true;
    } else {
      // Add directly
      demoIdentifications = [...demoIdentifications, newId];
      demoIdCounter++;
      taxonSearchQuery = '';
      selectedTaxon = null;
      taxonSearchResults = [];
    }
  }

  function handleDisagreementChoice(isDisagreement: boolean) {
    if (!pendingIdentification) return;

    if (isDisagreement && observation.taxon) {
      pendingIdentification.disagreement = true;
      pendingIdentification.previous_observation_taxon = observation.taxon;
    } else {
      pendingIdentification.disagreement = false;
      pendingIdentification.previous_observation_taxon = null;
    }

    demoIdentifications = [...demoIdentifications, pendingIdentification];
    demoIdCounter++;
    showDisagreementModal = false;
    pendingIdentification = null;
    taxonSearchQuery = '';
    selectedTaxon = null;
    taxonSearchResults = [];
  }

  function removeDemoIdentification(idToRemove: string) {
    demoIdentifications = demoIdentifications.filter(id => id.id !== idToRemove);
  }

  function getAllIdentifications(obs: any): any[] {
    return [...getSortedIdentifications(obs), ...demoIdentifications];
  }

  // Reactive computation of all identifications
  // Explicitly depend on demoIdentifications to ensure proper reactivity
  $: allIdentifications = observation ? [...getSortedIdentifications(observation), ...demoIdentifications] : [];

  // Reactive computation of algorithm summary and community taxon
  // Explicitly depend on demoIdentifications to ensure proper reactivity
  $: algorithmSummary = observation && demoIdentifications !== undefined ? calculateAlgorithmSummary(observation) : [];
  $: communityTaxon = algorithmSummary.find(row => row.isCommunityTaxon)?.taxon || null;
  $: communityTaxonStats = algorithmSummary.find(row => row.isCommunityTaxon) || null;

  // Check if user has opted out of community taxon
  // (user.preferences.prefers_community_taxa = false AND preferences.prefers_community_taxon != true)
  // OR preferences.prefers_community_taxon = false
  $: userOptedOutOfCommunityTaxon = observation ? (
    (observation.user?.preferences?.prefers_community_taxa === false &&
     observation.user?.preferences?.prefers_community_taxon !== true) ||
    observation.user?.preferences?.prefers_community_taxon === false
  ) : false;

  // Reactive computation for needs_id votes (combining observation votes and demo votes)
  $: allVotes = observation?.votes ? [...observation.votes, ...demoVotes] : [...demoVotes];
  $: needsIdVotes = allVotes.filter(v => v.vote_scope === 'needs_id');
  $: yesVotes = needsIdVotes.filter(v => v.vote_flag === true);
  $: noVotes = needsIdVotes.filter(v => v.vote_flag === false);

  // Check if votes should be disabled:
  // Enable votes when: community taxon exists AND it matches observation taxon (or user has opted out)
  // Disable votes when: no community taxon OR community taxon doesn't match observation taxon (unless user opted out)
  // Reference observation.taxon to ensure we react to changes
  $: votesDisabled = (() => {
    // If there are already votes, never disable the voting box
    if (yesVotes.length > 0 || noVotes.length > 0) {
      return false;
    }

    // Otherwise, use the normal logic
    return observation && observation.taxon && communityTaxon && observationTaxon ? (
      (communityTaxon.id !== observationTaxon.id && !userOptedOutOfCommunityTaxon)
    ) : !communityTaxon;
  })();

  // Reset votes whenever the community taxon changes
  $: {
    const currentCommunityTaxonId = communityTaxon?.id || null;

    // If this is not the first run and the community taxon has changed, reset votes
    if (previousCommunityTaxonId !== null && currentCommunityTaxonId !== previousCommunityTaxonId) {
      demoVotes = [];
    }

    // Update the tracked ID
    previousCommunityTaxonId = currentCommunityTaxonId;
  }

  function openVotesModal(type: 'yes' | 'no') {
    needsIdVotesModalType = type;
    showNeedsIdVotesModal = true;
  }

  function addVote(voteFlag: boolean) {
    if (!observation) return;

    const personLetter = String.fromCharCode(65 + demoVoteCounter); // A, B, C, etc.
    const emoji = getRandomEmoji();

    const newVote = {
      id: `demo-vote-${Date.now()}`,
      user: {
        login: `User${personLetter}`,
        icon: null,
        emoji: emoji
      },
      vote_scope: 'needs_id',
      vote_flag: voteFlag,
      created_at: new Date().toISOString()
    };

    demoVotes = [...demoVotes, newVote];
    demoVoteCounter++;
  }

  function removeDemoVote(voteId: string) {
    demoVotes = demoVotes.filter(v => v.id !== voteId);
  }

  // Get list of available observers (Person0 + any PersonX from demo identifications)
  $: availableObservers = observation && observation.id === -1 ? (() => {
    // Always start with Person0 as the original observer
    const person0 = {
      id: -1,
      login: 'Person0',
      icon: null,
      emoji: observation.user.emoji || getRandomEmoji(),
      preferences: {
        prefers_community_taxa: false,
        prefers_community_taxon: false
      }
    };
    const observers = [person0];

    // Add any PersonX from demo identifications
    demoIdentifications.forEach(id => {
      if (id.user.login.startsWith('Person') && id.user.login !== 'Person0' && !observers.find(o => o.login === id.user.login)) {
        observers.push(id.user);
      }
    });
    return observers;
  })() : [];

  function changeObserver(newObserver: any) {
    if (!observation) return;
    // Preserve the opted-out preferences from the original observer
    const newUser = {
      ...newObserver,
      preferences: {
        prefers_community_taxa: false,
        prefers_community_taxon: false
      }
    };
    observation.user = newUser;
    showObserverDropdown = false;
    // Trigger recalculation of observation taxon and quality grade
    observation = observation; // Force reactivity
  }

  // Update observation taxon and quality grade when identifications or votes change
  // This needs to run even when there are 0 identifications (e.g., when all are removed)
  // Explicitly depend on allIdentifications, communityTaxon, userOptedOutOfCommunityTaxon, yesVotes, noVotes, mode, and observation.user to ensure reactivity
  $: if (observation && observation.user && allIdentifications !== undefined && communityTaxon !== undefined && userOptedOutOfCommunityTaxon !== undefined && yesVotes !== undefined && noVotes !== undefined && mode !== undefined) {
    updateObservationTaxon();
    updateObservationQualityGrade();
    // Increment counter after calling updateObservationTaxon to trigger dependent reactive statements
    observationTaxonUpdateCounter++;
  }

  // Reactive statement to set observationTaxon based on disagreements
  // Depends on observationTaxonUpdateCounter which is incremented AFTER updateObservationTaxon completes
  // If there are disagreements, use communityTaxon
  // Otherwise, use observation.taxon (which was just set by updateObservationTaxon)
  $: {
    // Explicitly depend on the counter so this runs AFTER updateObservationTaxon completes
    const _counter = observationTaxonUpdateCounter;

    if (!observation) {
      observationTaxon = null;
    } else {
      const hasDisagreement = allIdentifications.some(id => id.disagreement === true);

      if (hasDisagreement && communityTaxon) {
        // With disagreement, use community taxon
        observationTaxon = communityTaxon;
      } else {
        // No disagreement - use observation.taxon
        observationTaxon = observation.taxon;
      }
    }
  }

  // Update URL when demo state changes
  $: if (observation && (demoIdentifications.length > 0 || demoVotes.length > 0 || mode !== 'current')) {
    updateURL();
  }

  function updateObservationTaxon() {
    if (!observation) return;

    const currentIdentifications = getAllIdentifications(observation).filter(id => id.current !== false);

    // If user has opted out of community taxon, use only the observer's identification
    if (userOptedOutOfCommunityTaxon) {
      // Find the observer's current identification
      const observerIdentification = currentIdentifications.find(
        id => id.user.login === observation.user.login || id.user.id === observation.user.id
      );

      if (observerIdentification) {
        observation.taxon = observerIdentification.taxon;
      } else {
        observation.taxon = null;
      }
      return;
    }

    // If there are no identifications (all removed), set taxon to null
    if (currentIdentifications.length === 0) {
      observation.taxon = null;
      return;
    }

    // If there's only one identification, set observation taxon to that identification's taxon
    if (currentIdentifications.length === 1) {
      // Alternative mode: if only ID is finer than species, use species ancestor instead
      if (mode === 'alternative') {
        const singleIdTaxon = currentIdentifications[0].taxon;
        if (singleIdTaxon && singleIdTaxon.rank_level && singleIdTaxon.rank_level < 10) {
          // Find species ancestor (rank_level = 10)
          const speciesAncestor = singleIdTaxon.ancestors?.find(a => a.rank_level === 10);
          observation.taxon = speciesAncestor || singleIdTaxon;
        } else {
          observation.taxon = singleIdTaxon;
        }
      } else {
        observation.taxon = currentIdentifications[0].taxon;
      }
      return;
    }

    // If there are 2+ identifications
    if (currentIdentifications.length >= 2) {
      // Check if there's a community taxon
      if (communityTaxon) {
        // Check if there are any disagreements
        const hasDisagreements = currentIdentifications.some(id => id.disagreement === true);

        if (hasDisagreements) {
          // If there are disagreements, set to community taxon
          observation.taxon = communityTaxon;
          // observationTaxon will be synced by reactive statement after this function completes
          return;
        } else {
          // No disagreements - look for the finest taxon that's downstream of (or same as) community taxon
          const downstreamIds = currentIdentifications.filter(id => {
            if (!id.taxon) return false;
            // Check if this ID's taxon is the community taxon or downstream of it
            return id.taxon.id === communityTaxon.id ||
              (id.taxon.ancestor_ids && id.taxon.ancestor_ids.includes(communityTaxon.id));
          });

          if (downstreamIds.length > 0) {
            // Find the finest (most specific) among the downstream taxa
            const finestDownstream = downstreamIds.reduce((finest, current) => {
              const finestRank = finest.taxon?.rank_level || Infinity;
              const currentRank = current.taxon?.rank_level || Infinity;
              return currentRank < finestRank ? current : finest;
            });

            const probTaxon = finestDownstream.taxon;

            // Alternative mode: observation.taxon can only be finer than species if community taxon is finer than species
            if (mode === 'alternative') {
              // If prob_taxon is finer than species (infraspecies) but community taxon is not
              if (probTaxon && probTaxon.rank_level && probTaxon.rank_level < 10 &&
                  communityTaxon.rank_level && communityTaxon.rank_level >= 10) {
                // Community taxon is at species or coarser - observation bottoms out at species level
                // Find species ancestor of prob_taxon
                const speciesAncestor = probTaxon.ancestors?.find(a => a.rank_level === 10);
                observation.taxon = speciesAncestor || communityTaxon;
              } else {
                // Community taxon is already infraspecies, or prob_taxon is not infraspecies - use prob_taxon
                observation.taxon = probTaxon;
              }
            } else {
              // Current mode: Edge case handling for infraspecies
              // If prob_taxon is finer than species (rank_level < 10) and is a descendant of community taxon
              if (probTaxon && probTaxon.rank_level && probTaxon.rank_level < 10 &&
                  probTaxon.ancestor_ids && probTaxon.ancestor_ids.includes(communityTaxon.id)) {

                // Find the first ID of prob_taxon (sorted by created_at, then by id for demo IDs)
                const probTaxonIds = currentIdentifications.filter(id => id.taxon?.id === probTaxon.id)
                  .sort((a, b) => {
                    const timeA = new Date(a.created_at).getTime();
                    const timeB = new Date(b.created_at).getTime();
                    if (timeA !== timeB) return timeA - timeB;
                    // For demo IDs with same timestamp, compare ID strings
                    return (a.id || '').localeCompare(b.id || '');
                  });
                const firstIdOfProbTaxon = probTaxonIds[0];

                // Find the first ID of community taxon
                const communityTaxonIds = currentIdentifications.filter(id => id.taxon?.id === communityTaxon.id)
                  .sort((a, b) => {
                    const timeA = new Date(a.created_at).getTime();
                    const timeB = new Date(b.created_at).getTime();
                    if (timeA !== timeB) return timeA - timeB;
                    return (a.id || '').localeCompare(b.id || '');
                  });
                const firstIdOfCommunityTaxon = communityTaxonIds[0];

                if (firstIdOfProbTaxon && firstIdOfCommunityTaxon) {
                  // Compare which came first
                  const probTaxonTime = new Date(firstIdOfProbTaxon.created_at).getTime();
                  const communityTaxonTime = new Date(firstIdOfCommunityTaxon.created_at).getTime();

                  if (probTaxonTime < communityTaxonTime) {
                    // prob_taxon was subspecific but first - use it
                    observation.taxon = probTaxon;
                  } else if (probTaxonTime > communityTaxonTime) {
                    // prob_taxon was added later - find its species ancestor
                    // Species rank level is 10
                    const speciesAncestor = probTaxon.ancestors?.find(a => a.rank_level === 10);
                    if (speciesAncestor) {
                      observation.taxon = speciesAncestor;
                    } else {
                      // No species ancestor found, use community taxon
                      observation.taxon = communityTaxon;
                    }
                  } else {
                    // Same timestamp, use community taxon
                    observation.taxon = communityTaxon;
                  }
                } else {
                  // Couldn't determine order, use prob_taxon as default
                  observation.taxon = probTaxon;
                }
              } else {
                // Normal case: use the finest downstream taxon
                observation.taxon = probTaxon;
              }
            }
            return;
          }
          // No downstream IDs found, set to community taxon
          observation.taxon = communityTaxon;
        }
      } else {
        // No community taxon yet - find the finest taxon among all IDs that doesn't have disagreements
        // Sort by rank_level (lower = finer) and pick the finest one
        const nonDisagreementIds = currentIdentifications.filter(id => !id.disagreement);
        if (nonDisagreementIds.length > 0) {
          const finestId = nonDisagreementIds.reduce((finest, current) => {
            const finestRank = finest.taxon?.rank_level || Infinity;
            const currentRank = current.taxon?.rank_level || Infinity;
            return currentRank < finestRank ? current : finest;
          });
          observation.taxon = finestId.taxon;
        }
      }
    }

  }

  function updateObservationQualityGrade() {
    if (!observation) return;

    // First, determine the base quality grade without considering votes

    // If user has opted out of community taxon AND has an observation taxon
    if (userOptedOutOfCommunityTaxon && observation.taxon) {
      // If observation taxon is coarser than species (rank_level > 10), set to needs_id
      if (observation.taxon.rank_level && observation.taxon.rank_level > 10) {
        observation.quality_grade = 'needs_id';
      } else if (communityTaxon) {
        // If there's a community taxon, check if observation taxon is a sibling
        // Check if taxa are siblings (different branches - not equal, ancestor, or descendant)
        const taxaAreEqual = observation.taxon.id === communityTaxon.id;
        const observationIsAncestor = communityTaxon.ancestor_ids &&
          communityTaxon.ancestor_ids.includes(observation.taxon.id);
        const observationIsDescendant = observation.taxon.ancestor_ids &&
          observation.taxon.ancestor_ids.includes(communityTaxon.id);

        const taxaAreSiblings = !taxaAreEqual && !observationIsAncestor && !observationIsDescendant;

        if (taxaAreSiblings) {
          observation.quality_grade = 'casual';
        }
      }
    } else if (communityTaxon) {
      // User has not opted out - use normal community taxon logic
      // Species rank level is 10, anything finer (lower number) is subspecies/variety/form
      // If community taxon is species (rank_level = 10) and observation taxon is finer (rank_level < 10),
      // then quality grade should be needs_id, not research
      const communityIsSpeciesOrFiner = communityTaxon.rank_level && communityTaxon.rank_level <= 10;

      // Check if observation taxon is finer than community taxon
      const observationIsFiner = observation.taxon &&
        observation.taxon.rank_level &&
        communityTaxon.rank_level &&
        observation.taxon.rank_level < communityTaxon.rank_level;

      if (communityIsSpeciesOrFiner && !observationIsFiner) {
        observation.quality_grade = 'research';
      } else {
        observation.quality_grade = 'needs_id';
      }
    } else {
      // No community taxon means needs ID
      observation.quality_grade = 'needs_id';
    }

    // Now check needs_id votes to potentially override quality grade
    // If false votes (No) > true votes (Yes) AND quality grade is needs_id
    if (noVotes.length > yesVotes.length && observation.quality_grade === 'needs_id') {
      // Check if observation.taxon matches community.taxon and is finer than family
      // Family rank_level is approximately 30, so finer means < 30
      if (observation.taxon && communityTaxon && observation.taxon.id === communityTaxon.id) {
        // Taxa match - check if finer than family
        if (observation.taxon.rank_level && observation.taxon.rank_level < 30) {
          observation.quality_grade = 'research';
        } else {
          observation.quality_grade = 'casual';
        }
      } else {
        // Taxa don't match
        observation.quality_grade = 'casual';
      }
    }

    // If true votes (Yes) > false votes (No) AND quality grade is research
    // Then the community is saying the taxon can be improved, so downgrade to needs_id
    if (yesVotes.length > noVotes.length && observation.quality_grade === 'research') {
      observation.quality_grade = 'needs_id';
    }
  }

  function calculateAlgorithmSummary(obs: any): any[] {
    const identifications = getAllIdentifications(obs).filter(id => id.current !== false);

    // Collect all unique taxa from all identifications
    const taxaMap = new Map();

    identifications.forEach(id => {
      if (!id.taxon) return;

      // Add the identification's taxon
      if (!taxaMap.has(id.taxon.id)) {
        taxaMap.set(id.taxon.id, id.taxon);
      }

      // Add all ancestors of this taxon
      if (id.taxon.ancestors) {
        id.taxon.ancestors.forEach(ancestor => {
          if (!taxaMap.has(ancestor.id)) {
            taxaMap.set(ancestor.id, ancestor);
          }
        });
      }
    });

    // Add "Life" as the root taxon
    const lifeTaxon = {
      id: 48460,
      name: 'Life',
      rank: 'stateofmatter',
      rank_level: 100,
      preferred_common_name: null,
      ancestor_ids: []
    };
    if (!taxaMap.has(lifeTaxon.id)) {
      taxaMap.set(lifeTaxon.id, lifeTaxon);
    }

    // Build a tree structure by finding children for each taxon
    const childrenMap = new Map();
    taxaMap.forEach(taxon => {
      childrenMap.set(taxon.id, []);
    });

    taxaMap.forEach(taxon => {
      // For each taxon, find its parent (the most specific/closest ancestor it has)
      if (taxon.ancestor_ids && taxon.ancestor_ids.length > 0) {
        // Find the immediate parent: the ancestor in our map that is closest to this taxon
        // In taxonomy, higher rank_level = broader (Kingdom ~70), lower rank_level = finer (Species ~10)
        // So we want the ancestor with the LOWEST rank_level that is still GREATER than this taxon's rank_level
        let parentId = null;
        let lowestParentRankLevel = Infinity;

        taxon.ancestor_ids.forEach(ancestorId => {
          const ancestor = taxaMap.get(ancestorId);
          if (ancestor &&
              (ancestor.rank_level || 0) > (taxon.rank_level || 0) &&
              (ancestor.rank_level || 0) < lowestParentRankLevel) {
            lowestParentRankLevel = ancestor.rank_level || 0;
            parentId = ancestorId;
          }
        });

        if (parentId && childrenMap.has(parentId)) {
          childrenMap.get(parentId).push(taxon);
        } else {
          // If no parent found in the map, attach to Life
          childrenMap.get(lifeTaxon.id).push(taxon);
        }
      } else if (taxon.id !== lifeTaxon.id) {
        // If no ancestors, attach directly to Life
        childrenMap.get(lifeTaxon.id).push(taxon);
      }
    });

    // Helper function to count cumulative IDs for a taxon
    function countCumulativeIds(taxon) {
      return identifications.filter(id => {
        if (!id.taxon) return false;
        return id.taxon.id === taxon.id ||
               (id.taxon.ancestor_ids && id.taxon.ancestor_ids.includes(taxon.id));
      }).length;
    }

    // Flatten the tree in depth-first order (visiting all descendants before siblings)
    const allTaxaWithLife = [];
    function addTaxonAndDescendants(taxon) {
      allTaxaWithLife.push(taxon);
      const children = childrenMap.get(taxon.id) || [];
      // Sort children by:
      // 1. rank_level descending (coarser/broader first)
      // 2. cumulative ID count descending (more IDs first)
      // 3. name alphabetically for stability
      children.sort((a, b) => {
        const rankDiff = (b.rank_level || 0) - (a.rank_level || 0);
        if (rankDiff !== 0) return rankDiff;

        const countDiff = countCumulativeIds(b) - countCumulativeIds(a);
        if (countDiff !== 0) return countDiff;

        return (a.name || '').localeCompare(b.name || '');
      });
      // Process each child completely (including all its descendants) before moving to next sibling
      children.forEach(child => addTaxonAndDescendants(child));
    }
    addTaxonAndDescendants(lifeTaxon);

    const results = allTaxaWithLife.map(taxon => {
      const idsForThisTaxon = identifications.filter(id => id.taxon?.id === taxon.id);
      const cumulativeIds = identifications.filter(id => {
        if (!id.taxon) return false;
        return id.taxon.id === taxon.id ||
               (id.taxon.ancestor_ids && id.taxon.ancestor_ids.includes(taxon.id));
      });

      // A disagreement is when the ID's taxon is NOT in the ancestry of this taxon AND
      // this taxon is NOT in the ancestry of the ID's taxon (i.e., they're in different branches)
      const disagreements = identifications.filter(id => {
        if (!id.taxon) return false;

        // If the ID's taxon matches this taxon, it agrees
        if (id.taxon.id === taxon.id) {
          return false;
        }

        // If the ID's taxon has this taxon in its ancestry (ID is more specific), it agrees
        if (id.taxon.ancestor_ids && id.taxon.ancestor_ids.includes(taxon.id)) {
          return false;
        }

        // If this taxon has the ID's taxon in its ancestry (ID is coarser/broader), it agrees
        if (taxon.ancestor_ids && taxon.ancestor_ids.includes(id.taxon.id)) {
          return false;
        }

        // Only count as disagreement if they're in completely different branches
        return true;
      });

      // Ancestor disagreements: IDs marked as disagreements that are ancestors of this taxon
      // These are IDs where disagreement=true AND the ID's taxon is an ancestor of this taxon
      // (but NOT the taxon itself - only apply to downstream/more specific taxa)
      const ancestorDisagreements = identifications.filter(id => {
        if (!id.taxon || !id.disagreement) return false;
        // Check if the ID's taxon is an ancestor of this taxon (not the same taxon)
        return id.taxon.id !== taxon.id && taxon.ancestor_ids && taxon.ancestor_ids.includes(id.taxon.id);
      });

      const score = cumulativeIds.length / (cumulativeIds.length + disagreements.length + ancestorDisagreements.length);

      return {
        taxon,
        identificationCount: idsForThisTaxon.length,
        cumulativeCount: cumulativeIds.length,
        disagreementCount: disagreements.length,
        ancestorDisagreements: ancestorDisagreements.length,
        score,
        totalIds: identifications.length
      };
    });

    // Find the finest taxon with score > 2/3 AND cumulative count >= 2
    // This ensures we only highlight taxa with at least 2 cumulative IDs
    let finestQualifyingIndex = -1;
    if (identifications.length >= 2) {
      for (let i = results.length - 1; i >= 0; i--) {
        if (results[i].score > 2/3 && results[i].cumulativeCount >= 2) {
          finestQualifyingIndex = i;
          break;
        }
      }
    }

    // Mark the finest qualifying row
    return results.map((row, index) => ({
      ...row,
      isCommunityTaxon: index === finestQualifyingIndex
    }));
  }
</script>

<main>
  <div class="header-container">
    <h1 class="clickable-title" on:click={resetApp}>
      <img src="https://static.inaturalist.org/wiki_page_attachments/3154-original.png" alt="iNaturalist logo" class="title-logo" />
      iNaturalist Subspecies Identifications Demo
    </h1>
    <div class="header-disclaimer">
      <div class="disclaimer-line">This demo does not write anything back to iNat.</div>
      <div class="disclaimer-line"><strong>No data will change on iNat via its use.</strong></div>
    </div>
    <div class="header-controls">
      <button class="tutorial-btn" on:click={() => showTutorialModal = true}>
        Tutorial
      </button>
      <div class="mode-toggle">
        <span class="mode-label">Mode:</span>
        <label class="mode-option">
          <input type="radio" name="mode" value="current" bind:group={mode} />
          <span>Current</span>
        </label>
        <label class="mode-option">
          <input type="radio" name="mode" value="alternative" bind:group={mode} />
          <span>Alternative</span>
        </label>
      </div>
      <button class="survey-btn" on:click={() => showSurveyModal = true}>
        Vote on your preference
      </button>
    </div>
  </div>

  {#if !observation}
    <div class="demo-intro">
      <p>This demo compares how iNaturalist currently handles subspecies identifications versus a proposed alternative approach. Click an example below or enter an observation ID to explore the differences. Click "Tutorial" in the header for detailed instructions. <a href="https://www.inaturalist.org/blog/122781" target="_blank" rel="noopener noreferrer">Read more on our blog</a>.</p>
      <div class="demo-links">
        <a href="/subspecies_identifications_demo/?obs=0&ids=120135%3AA%3A%25F0%259F%2598%2583%3A0%7C27250%3AB%3A%25F0%259F%2599%2583%3A0" class="demo-link">
          <img src="/subspecies_identifications_demo/current.jpg" alt="Current" />
        </a>
        <a href="/subspecies_identifications_demo/?obs=0&mode=alternative&ids=120135%3AA%3A%25F0%259F%2598%2583%3A0%7C27250%3AB%3A%25F0%259F%2599%2583%3A0" class="demo-link">
          <img src="/subspecies_identifications_demo/alternative.jpg" alt="Alternative" />
        </a>
      </div>
    </div>
  {/if}

  {#if !observation}
    <form on:submit={handleSubmit}>
      <div class="input-group">
        <input
          id="obs-id"
          type="text"
          bind:value={observationId}
          placeholder="Load an iNat observation by entering the ID, e.g. 47963, or click the Tutorial for more details"
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Loading...' : 'Fetch Observation'}
        </button>
      </div>
    </form>

    {#if error}
      <div class="error">
        {error}
      </div>
    {/if}
  {/if}

  {#if observation}
    {#if mode === 'alternative'}
      <div class="alternative-explanation">
        This mode simulates a proposed alternative for handling infraspecies on iNaturalist, where observations do not advance to infraspecies until the community taxon itself reaches the infraspecies rank.
      </div>
    {/if}

    <div class="results">
      <div class="taxon-quality-row">
        <span class="taxon-name-display">{getTaxonDisplay(observation)}</span>
        <div class="quality-grade-container">
          <span class="quality-grade {observation.quality_grade}">
            {getQualityGradeDisplay(observation.quality_grade)}
          </span>
          {#if observation.id && observation.id > 0}
            <a href="https://www.inaturalist.org/observations/{observation.id}" target="_blank" rel="noopener noreferrer" class="obs-link" title="View on iNaturalist">
              🔗
            </a>
          {/if}
        </div>
      </div>

      <div class="obs-content">
        <div class="photo-column">
          {#if getPhotoUrl(observation)}
            <img src={getPhotoUrl(observation).replace('square', 'medium')} alt="Observation" class="observation-photo" />
          {/if}
        </div>
        <div class="info-column">
          <div class="detail">
            <strong>Observed:</strong> {observation.observed_on || 'No date recorded'}
          </div>
          <div class="detail user-detail">
            <strong>Observer:</strong>
            <div class="user-info-container">
              {#if observation.id === -1}
                <div class="observer-chooser">
                  <button
                    class="observer-selector"
                    on:click={() => showObserverDropdown = !showObserverDropdown}
                  >
                    <div class="user-info">
                      {#if observation.user.icon}
                        <img src={observation.user.icon} alt={observation.user.login} class="user-icon" />
                      {:else}
                        {#if observation.user.emoji}
                          <div class="user-icon-placeholder smiley">
                            {observation.user.emoji}
                          </div>
                        {:else}
                          <div class="user-icon-placeholder">
                            {observation.user.login.charAt(0).toUpperCase()}
                          </div>
                        {/if}
                      {/if}
                      <span class="user-login">{observation.user.login}</span>
                      <span class="dropdown-arrow">▼</span>
                    </div>
                  </button>
                  {#if showObserverDropdown && availableObservers.length > 0}
                    <div class="observer-dropdown">
                      {#each availableObservers as observer}
                        <button
                          class="observer-option"
                          class:selected={observer.login === observation.user.login}
                          on:click={() => changeObserver(observer)}
                        >
                          {#if observer.icon}
                            <img src={observer.icon} alt={observer.login} class="user-icon" />
                          {:else}
                            {#if observer.emoji}
                              <div class="user-icon-placeholder smiley">
                                {observer.emoji}
                              </div>
                            {:else}
                              <div class="user-icon-placeholder">
                                {observer.login.charAt(0).toUpperCase()}
                              </div>
                            {/if}
                          {/if}
                          <span class="user-login">{observer.login}</span>
                        </button>
                      {/each}
                    </div>
                  {/if}
                </div>
              {:else}
                <div class="user-info">
                  {#if observation.user.icon}
                    <img src={observation.user.icon} alt={observation.user.login} class="user-icon" />
                  {:else}
                    {#if observation.user.emoji}
                      <div class="user-icon-placeholder smiley">
                        {observation.user.emoji}
                      </div>
                    {:else}
                      <div class="user-icon-placeholder">
                        {observation.user.login.charAt(0).toUpperCase()}
                      </div>
                    {/if}
                  {/if}
                  <span class="user-login">{observation.user.login}</span>
                </div>
              {/if}
            </div>
          </div>
          <div class="community-taxon-section">
            <div class="community-taxon-label">
              <strong>Community Taxon:</strong>
              <button
                class="whats-this-link"
                class:disabled={allIdentifications.length < 2}
                on:click={() => { if (allIdentifications.length >= 2) showAlgorithmModal = true; }}
              >
                what's this?
              </button>
            </div>
            {#if userOptedOutOfCommunityTaxon}
              <div class="user-opted-out-message">
                User has opted-out of Community Taxon
              </div>
            {/if}
            <div class="community-taxon-box">
              {#if communityTaxon}
                <div class="community-taxon-info">
                  {#if communityTaxon.default_photo?.medium_url}
                    <img
                      src={communityTaxon.default_photo.medium_url}
                      alt={communityTaxon.name}
                      class="community-taxon-icon"
                    />
                  {/if}
                  <span class="community-taxon-name">
                    {communityTaxon.preferred_common_name
                      ? `${communityTaxon.preferred_common_name} (${communityTaxon.name})`
                      : communityTaxon.name}
                  </span>
                </div>
                <div class="cumulative-ids">
                  {#if communityTaxonStats}
                    Cumulative IDs: {communityTaxonStats.cumulativeCount} of {communityTaxonStats.cumulativeCount + communityTaxonStats.disagreementCount + communityTaxonStats.ancestorDisagreements}
                  {/if}
                </div>
              {:else}
                <div class="community-taxon-message">
                  The Community ID requires at least two identifications.
                </div>
              {/if}
            </div>
          </div>
        </div>
      </div>

      <div class="identifications-section">
        <h3>Identification activity</h3>
        {#if allIdentifications.length > 0}
          {#each allIdentifications as identification}
            <div class="identification-item {identification.current === false ? 'withdrawn' : ''}">
              <div class="id-user">
                {#if identification.user.icon}
                  <img src={identification.user.icon} alt={identification.user.login} class="user-icon" />
                {:else}
                  {#if identification.user.emoji}
                    <div class="user-icon-placeholder smiley">
                      {identification.user.emoji}
                    </div>
                  {:else}
                    <div class="user-icon-placeholder">
                      {identification.user.login.charAt(0).toUpperCase()}
                    </div>
                  {/if}
                {/if}
                <span class="user-login">{identification.user.login}</span>
              </div>
              <div class="id-taxon">
                {#if getIdPhotoUrl(identification)}
                  <img src={getIdPhotoUrl(identification)} alt={identification.taxon?.name || 'Taxon'} class="taxon-photo" />
                {/if}
                <div class="taxon-info">
                  <span class="taxon-name">{getTaxonDisplayForId(identification.taxon)}</span>
                  {#if identification.disagreement && identification.previous_observation_taxon}
                    <div class="disagreement">
                      Disagrees with {identification.previous_observation_taxon.name}
                    </div>
                  {/if}
                </div>
              </div>
              {#if identification.id && typeof identification.id === 'string' && identification.id.startsWith('demo-')}
                <button class="remove-id-btn" on:click={() => removeDemoIdentification(identification.id)}>
                  ×
                </button>
              {/if}
            </div>
          {/each}
        {/if}

        <div class="add-id-form">
          <h4>Add your identification</h4>
          <div class="taxon-search">
            <input
              type="text"
              bind:value={taxonSearchQuery}
              on:input={searchTaxa}
              placeholder="Search for a taxon..."
              class="taxon-input"
            />
            {#if showTaxonDropdown && taxonSearchResults.length > 0}
              <div class="taxon-dropdown">
                {#each taxonSearchResults as taxon}
                  <div class="taxon-result" on:click={() => selectTaxon(taxon)}>
                    {#if taxon.default_photo?.square_url}
                      <img src={taxon.default_photo.square_url} alt={taxon.name} class="taxon-result-photo" />
                    {/if}
                    <div class="taxon-result-info">
                      <div class="taxon-result-name">
                        {taxon.preferred_common_name ? `${taxon.preferred_common_name} (${taxon.name})` : taxon.name}
                      </div>
                    </div>
                  </div>
                {/each}
              </div>
            {/if}
          </div>
          <button
            type="button"
            class="submit-id-btn"
            on:click={submitIdentification}
            disabled={!selectedTaxon}
          >
            Add Identification
          </button>
        </div>

        <div class="needs-id-votes-section" class:disabled={votesDisabled}>
          <div class="needs-id-votes-label">
            Based on the evidence, can the Community Taxon be improved?<br/>
            {#if communityTaxon}
              Current Community Taxon: {communityTaxon.preferred_common_name
                ? `${communityTaxon.preferred_common_name} (${communityTaxon.name})`
                : communityTaxon.name}
            {:else}
              Current Community Taxon: None
            {/if}
          </div>
            <div class="needs-id-votes-row">
              <div class="vote-option">
                <button
                  class="vote-checkmark"
                  on:click={() => addVote(true)}
                  title="Vote Yes"
                  disabled={votesDisabled}
                >✓</button>
                <span class="vote-label">Yes</span>
                {#if yesVotes.length > 0}
                  <button class="vote-count" on:click={() => openVotesModal('yes')}>
                    ({yesVotes.length})
                  </button>
                {:else}
                  <span class="vote-count-zero">(0)</span>
                {/if}
              </div>
              <div class="vote-option">
                <button
                  class="vote-checkmark"
                  on:click={() => addVote(false)}
                  title="Vote No"
                  disabled={votesDisabled}
                >✓</button>
                <span class="vote-label">No, it's as good as it can be</span>
                {#if noVotes.length > 0}
                  <button class="vote-count" on:click={() => openVotesModal('no')}>
                    ({noVotes.length})
                  </button>
                {:else}
                  <span class="vote-count-zero">(0)</span>
                {/if}
              </div>
            </div>
          </div>
      </div>
    </div>

    <form on:submit={handleSubmit} class="bottom-form">
      <div class="input-group">
        <input
          id="obs-id-bottom"
          type="text"
          bind:value={observationId}
          placeholder="Load an iNat observation by entering the ID, e.g. 47963, or click the Tutorial for more details"
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Loading...' : 'Fetch Observation'}
        </button>
      </div>
    </form>

    {#if error}
      <div class="error">
        {error}
      </div>
    {/if}
  {/if}

  {#if showAlgorithmModal && observation}
    <div class="modal-overlay" on:click={() => showAlgorithmModal = false}>
      <div class="modal-content" on:click|stopPropagation>
        <div class="modal-header">
          <h2>Algorithm Summary</h2>
          <button class="modal-close" on:click={() => showAlgorithmModal = false}>×</button>
        </div>
        <div class="modal-body">
          <table class="algorithm-table">
            <thead>
              <tr>
                <th>Taxon</th>
                <th>Identification Count</th>
                <th>Cumulative Count</th>
                <th>Disagreement Count</th>
                <th>Ancestor Disagreements</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody>
              {#each algorithmSummary as row}
                <tr class:community-taxon-row={row.isCommunityTaxon}>
                  <td>
                    {#if row.taxon.preferred_common_name}
                      {row.taxon.preferred_common_name} {row.taxon.rank} {row.taxon.name}
                    {:else}
                      {row.taxon.rank} {row.taxon.name}
                    {/if}
                  </td>
                  <td>{row.identificationCount}</td>
                  <td>{row.cumulativeCount}</td>
                  <td>{row.disagreementCount}</td>
                  <td>{row.ancestorDisagreements}</td>
                  <td>
                    {row.cumulativeCount} / ({row.cumulativeCount}+{row.disagreementCount}+{row.ancestorDisagreements}={row.cumulativeCount + row.disagreementCount + row.ancestorDisagreements}) = {row.score.toFixed(2)}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  {/if}

  {#if showDisagreementModal && pendingIdentification && observation && observation.taxon}
    <div class="modal-overlay" on:click={() => { showDisagreementModal = false; pendingIdentification = null; }}>
      <div class="modal-content disagreement-modal" on:click|stopPropagation>
        <div class="modal-header">
          <h2>Potential Disagreement</h2>
          <button class="modal-close" on:click={() => { showDisagreementModal = false; pendingIdentification = null; }}>×</button>
        </div>
        <div class="modal-body">
          <p class="disagreement-question">
            Is the evidence provided enough to confirm this is
            {observation.taxon.preferred_common_name
              ? `${observation.taxon.preferred_common_name} (${observation.taxon.rank} ${observation.taxon.name})`
              : `${observation.taxon.rank} ${observation.taxon.name}`}?
          </p>
          <div class="disagreement-options">
            <button
              class="disagreement-btn btn-yes"
              on:click={() => handleDisagreementChoice(false)}
            >
              I don't know but I am sure this is
              {pendingIdentification.taxon.preferred_common_name
                ? `${pendingIdentification.taxon.preferred_common_name} (${pendingIdentification.taxon.rank} ${pendingIdentification.taxon.name})`
                : `${pendingIdentification.taxon.rank} ${pendingIdentification.taxon.name}`}
            </button>
            <button
              class="disagreement-btn btn-no"
              on:click={() => handleDisagreementChoice(true)}
            >
              No but it is a member of
              {pendingIdentification.taxon.preferred_common_name
                ? `${pendingIdentification.taxon.preferred_common_name} (${pendingIdentification.taxon.rank} ${pendingIdentification.taxon.name})`
                : `${pendingIdentification.taxon.rank} ${pendingIdentification.taxon.name}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  {/if}

  {#if showNeedsIdVotesModal && needsIdVotesModalType}
    <div class="modal-overlay" on:click={() => { showNeedsIdVotesModal = false; needsIdVotesModalType = null; }}>
      <div class="modal-content votes-modal" on:click|stopPropagation>
        <div class="modal-header">
          <h2>{needsIdVotesModalType === 'yes' ? 'Yes' : 'No, it\'s as good as it can be'} Votes</h2>
          <button class="modal-close" on:click={() => { showNeedsIdVotesModal = false; needsIdVotesModalType = null; }}>×</button>
        </div>
        <div class="modal-body">
          <ul class="voters-list">
            {#each (needsIdVotesModalType === 'yes' ? yesVotes : noVotes) as vote}
              <li class="voter-item">
                {#if vote.user?.icon}
                  <img src={vote.user.icon} alt={vote.user.login} class="voter-icon" />
                {:else}
                  {#if vote.user?.emoji}
                    <div class="voter-icon-placeholder smiley">
                      {vote.user.emoji}
                    </div>
                  {:else}
                    <div class="voter-icon-placeholder">
                      {vote.user?.login?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                  {/if}
                {/if}
                <span class="voter-login">{vote.user?.login || 'Unknown'}</span>
                {#if vote.id && typeof vote.id === 'string' && vote.id.startsWith('demo-vote-')}
                  <button class="remove-vote-btn" on:click={() => removeDemoVote(vote.id)}>
                    ×
                  </button>
                {/if}
              </li>
            {/each}
          </ul>
        </div>
      </div>
    </div>
  {/if}

  {#if showSurveyModal}
    <div class="modal-overlay" on:click={() => showSurveyModal = false}>
      <div class="modal-content survey-modal" on:click|stopPropagation>
        <div class="modal-header">
          <h2>Vote on your preference</h2>
          <button class="modal-close" on:click={() => showSurveyModal = false}>×</button>
        </div>
        <div class="modal-body survey-body">
          <div data-tf-live="we8cmOvB"></div>
        </div>
      </div>
    </div>
  {/if}

  {#if showTutorialModal}
    <div class="modal-overlay" on:click={() => showTutorialModal = false}>
      <div class="modal-content tutorial-modal" on:click|stopPropagation>
        <div class="modal-header">
          <h2>How to Use This Demo</h2>
          <button class="modal-close" on:click={() => showTutorialModal = false}>×</button>
        </div>
        <div class="modal-body tutorial-body">
          <h3>Getting Started</h3>
          <ol>
            <li><strong>Load an observation</strong> by entering an iNaturalist observation ID (e.g., 47963 which you find in an observation URL, e.g. <a href="https://www.inaturalist.org/observations/47963" target="_blank" rel="noopener noreferrer">https://www.inaturalist.org/observations/47963</a>) in the input field and clicking "Fetch Observation"
              <ul>
                <li>Or use <code>0</code> for a blank unknown observation</li>
                <li>Or use <code>-1</code> for a blank observation with an observer who has opted-out of the community taxon</li>
                <li>Or click on one of the example images to see a pre-configured scenario</li>
              </ul>
            </li>
          </ol>

          <h3>Exploring the Demo</h3>
          <ol start="2">
            <li><strong>Toggle between modes</strong> using the "Current" and "Alternative" radio buttons in the upper right to see how each approach handles subspecies identifications</li>
            <li><strong>Add identifications</strong> by:
              <ul>
                <li>Scrolling to the "Add your identification" section</li>
                <li>Searching for a taxon by typing in the search box</li>
                <li>Selecting a taxon from the dropdown</li>
                <li>Clicking "Add Identification"</li>
              </ul>
            </li>
            <li><strong>View the algorithm</strong> by clicking "what's this?" next to "Community Taxon" to see how the community taxon is calculated</li>
            <li><strong>Add votes</strong> on whether the Community Taxon can be improved by clicking the checkmarks next to "Yes" or "No, it's as good as it can be"</li>
            <li><strong>Vote on your preference</strong> between Current and Alternative modes by clicking the "Vote on your preference" button in the upper right</li>
            <li><strong>Reset the demo</strong> at any time by clicking on the title "iNaturalist Subspecies Identifications Demo"</li>
          </ol>

          <h3>Understanding the Display</h3>
          <ul>
            <li>Watch how the <strong>observation label</strong> (shown at the top) changes as you add identifications</li>
            <li>The <strong>quality grade</strong> badge shows whether the observation is Research Grade, Needs ID, or Casual</li>
            <li>The <strong>Community Taxon</strong> box shows the calculated consensus identification</li>
            <li>Demo identifications and votes have an "×" button to remove them</li>
          </ul>
        </div>
      </div>
    </div>
  {/if}

  <footer class="demo-footer">
    <p>This is a temporary demo built quickly using <a href="https://code.claude.com/docs/en/overview" target="_blank" rel="noopener noreferrer">Claude Code</a>, it does not adhere to the engineering standards of the iNaturalist <a href="https://www.inaturalist.org/" target="_blank" rel="noopener noreferrer">platform</a> or <a href="https://github.com/inaturalist" target="_blank" rel="noopener noreferrer">codebase</a>. The demo will be live only for as long as it takes to come to a path forward. Once we deploy and QA an update to the main site, we will retire this demo.</p>
    <p class="footer-links">
      <a href="https://github.com/inaturalist/inaturalist.github.io/tree/main/subspecies_identifications_demo" target="_blank" rel="noopener noreferrer">Source</a>
      <span class="separator">•</span>
      <span>Last updated: January 8, 2026</span>
    </p>
  </footer>
</main>


<style>
  main {
    max-width: 800px;
    min-width: 688px;
    margin: 2rem auto;
    padding: 2rem;
    padding-top: 5rem;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  }

  .header-container {
    position: fixed;
    top: 0;
    left: 0;
    padding: 1rem 1.5rem;
    background-color: white;
    z-index: 1000;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    width: 100%;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }

  h1 {
    color: #333;
    font-size: 1.2rem;
    margin: 0;
    flex-shrink: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .title-logo {
    height: 32px;
    width: auto;
  }

  .clickable-title {
    cursor: pointer;
    transition: color 0.2s;
  }

  .clickable-title:hover {
    color: #74ac00;
  }

  .header-disclaimer {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.1rem;
  }

  .disclaimer-line {
    font-size: 0.75rem;
    color: #666;
    font-style: italic;
    line-height: 1.2;
  }

  .mode-toggle {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-shrink: 0;
    white-space: nowrap;
  }

  .mode-label {
    font-size: 0.9rem;
    color: #555;
    font-weight: 500;
  }

  .mode-option {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    cursor: pointer;
    font-size: 0.85rem;
    color: #555;
  }

  .mode-option input[type="radio"] {
    width: auto;
    margin: 0;
    cursor: pointer;
  }

  .mode-option span {
    cursor: pointer;
  }

  .demo-intro {
    margin-bottom: 2rem;
    text-align: center;
  }

  .demo-intro p {
    font-size: 1rem;
    line-height: 1.6;
    color: #333;
    margin-bottom: 1.5rem;
  }

  .demo-links {
    display: flex;
    justify-content: center;
    gap: 2rem;
    align-items: center;
  }

  .demo-link {
    display: block;
    text-decoration: none;
    transition: transform 0.2s;
  }

  .demo-link:hover {
    transform: scale(1.05);
  }

  .demo-link img {
    width: 250px;
    height: 400px;
    object-fit: contain;
    border: 2px solid #ddd;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .alternative-explanation {
    background-color: #e3f2fd;
    border: 1px solid #90caf9;
    border-radius: 4px;
    padding: 1rem;
    margin-bottom: 1rem;
    color: #1565c0;
    font-size: 0.95rem;
    line-height: 1.5;
  }

  h2 {
    color: #555;
    font-size: 1.5rem;
    margin-bottom: 1rem;
  }

  .input-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1rem;
    width: 100%;
  }

  input {
    padding: 0.75rem;
    font-size: 1rem;
    border: 2px solid #ddd;
    border-radius: 4px;
    transition: border-color 0.3s;
    width: 100%;
    box-sizing: border-box;
  }

  input:focus {
    outline: none;
    border-color: #74ac00;
  }

  button {
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    font-weight: 600;
    color: white;
    background-color: #74ac00;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.3s;
    width: 100%;
  }

  button:hover:not(:disabled) {
    background-color: #5d8800;
  }

  button:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }

  .error {
    padding: 1rem;
    background-color: #fee;
    border: 1px solid #fcc;
    border-radius: 4px;
    color: #c00;
    margin-top: 1rem;
  }

  .results {
    margin-top: 2rem;
    padding: 1.5rem;
    background-color: #f8f8f8;
    border-radius: 4px;
    border: 1px solid #ddd;
  }

  .taxon-quality-row {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
  }

  .taxon-name-display {
    font-size: 1.3rem;
    font-weight: 600;
    color: #333;
  }

  .quality-grade-container {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .obs-link {
    font-size: 1.2rem;
    text-decoration: none;
    transition: transform 0.2s;
    display: inline-block;
  }

  .obs-link:hover {
    transform: scale(1.2);
  }

  .obs-content {
    display: flex;
    gap: 1.5rem;
    margin-bottom: 1.5rem;
  }

  .photo-column {
    flex-shrink: 0;
    width: 200px;
  }

  .observation-photo {
    width: 100%;
    height: auto;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .info-column {
    flex: 1;
    min-width: 350px;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }

  .detail {
    font-size: 1rem;
    white-space: nowrap;
  }

  .detail strong {
    color: #555;
    display: inline;
    margin-right: 0.5rem;
  }

  .quality-grade {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 3px;
    font-size: 0.95rem;
    font-weight: 600;
  }

  .quality-grade.research {
    background-color: #74ac00;
    color: white;
  }

  .quality-grade.needs_id {
    background-color: #ffc107;
    color: #333;
  }

  .quality-grade.casual {
    background-color: #999;
    color: white;
  }

  .user-detail {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    white-space: nowrap;
  }

  .user-info {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
  }

  .user-icon {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    object-fit: cover;
  }

  .user-icon-placeholder {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background-color: #74ac00;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
  }

  .user-login {
    font-weight: 500;
  }

  .user-info-container {
    position: relative;
    display: inline-flex;
  }

  .observer-chooser {
    position: relative;
  }

  .observer-selector {
    background: none;
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 0.25rem 0.5rem;
    cursor: pointer;
    width: auto;
    transition: all 0.2s;
    color: #000;
  }

  .observer-selector:hover {
    border-color: #74ac00;
    background-color: #f9f9f9;
    color: #000;
  }

  .observer-selector .user-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .observer-selector .user-login {
    color: #000;
  }

  .dropdown-arrow {
    font-size: 0.7rem;
    color: #666;
    margin-left: 0.25rem;
  }

  .observer-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    margin-top: 0.25rem;
    background: white;
    border: 1px solid #ddd;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    z-index: 100;
    min-width: 150px;
  }

  .observer-option {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    background: none;
    border: none;
    border-bottom: 1px solid #f0f0f0;
    cursor: pointer;
    width: 100%;
    text-align: left;
    transition: background-color 0.2s;
    color: #000;
  }

  .observer-option:last-child {
    border-bottom: none;
  }

  .observer-option:hover {
    background-color: #f5f5f5;
    color: #000;
  }

  .observer-option.selected {
    background-color: #e8f5e9;
    color: #000;
  }

  .observer-option .user-login {
    color: #000;
  }

  .community-taxon-section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .community-taxon-label {
    text-align: left;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .community-taxon-label strong {
    color: #555;
  }

  .whats-this-link {
    background: none;
    border: none;
    color: #74ac00;
    text-decoration: underline;
    cursor: pointer;
    font-size: 0.85rem;
    padding: 0;
    width: auto;
  }

  .whats-this-link:hover {
    color: #5d8800;
    background: none;
  }

  .whats-this-link.disabled {
    color: #999;
    cursor: default;
    text-decoration: none;
  }

  .whats-this-link.disabled:hover {
    color: #999;
  }

  .community-taxon-box {
    background-color: white;
    padding: 0.75rem;
    border-radius: 4px;
    border: 1px solid #e0e0e0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    min-width: 414px;
  }

  .community-taxon-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .community-taxon-icon {
    width: 48px;
    height: 48px;
    border-radius: 4px;
    object-fit: cover;
  }

  .community-taxon-name {
    font-weight: 500;
  }

  .cumulative-ids {
    font-size: 0.9rem;
    color: #666;
    padding-top: 0.25rem;
  }

  .community-taxon-message {
    font-size: 0.95rem;
    color: #666;
    font-style: italic;
  }

  .user-opted-out-message {
    font-size: 0.9rem;
    color: #ff9800;
    font-style: italic;
    padding: 0.5rem;
    background-color: #fff3e0;
    border-radius: 4px;
    border: 1px solid #ffe0b2;
  }

  .identifications-section {
    margin-top: 1.5rem;
    padding-top: 1rem;
    border-top: 2px solid #ddd;
  }

  .identifications-section h3 {
    font-size: 1.1rem;
    color: #555;
    margin-bottom: 0.75rem;
    text-align: left;
  }

  .identification-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.75rem;
    margin-bottom: 0.5rem;
    background-color: white;
    border-radius: 4px;
    border: 1px solid #e0e0e0;
    position: relative;
  }

  .remove-id-btn {
    position: absolute;
    top: 0.25rem;
    right: 0.25rem;
    background: none;
    border: none;
    font-size: 1.5rem;
    line-height: 1;
    color: #999;
    cursor: pointer;
    padding: 0.25rem 0.5rem;
    width: auto;
  }

  .remove-id-btn:hover {
    color: #c00;
    background-color: transparent;
  }

  .identification-item.withdrawn {
    background-color: #f5f5f5;
    opacity: 0.6;
  }

  .identification-item.withdrawn .taxon-name {
    text-decoration: line-through;
    color: #999;
  }

  .identification-item.withdrawn .user-login {
    color: #999;
  }

  .id-user {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    min-width: 150px;
  }

  .id-taxon {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex: 1;
  }

  .taxon-photo {
    width: 48px;
    height: 48px;
    border-radius: 4px;
    object-fit: cover;
    flex-shrink: 0;
  }

  .taxon-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .taxon-name {
    font-weight: 500;
  }

  .disagreement {
    font-size: 0.85rem;
    color: #c00;
    font-style: italic;
  }

  .user-icon-placeholder.smiley {
    font-size: 20px;
    line-height: 32px;
  }

  .add-id-form {
    margin-top: 1rem;
    padding: 1rem;
    background-color: #f9f9f9;
    border-radius: 4px;
    border: 1px solid #ddd;
  }

  .add-id-form h4 {
    font-size: 1rem;
    color: #555;
    margin: 0 0 0.75rem 0;
  }

  .taxon-search {
    position: relative;
    margin-bottom: 0.75rem;
  }

  .taxon-input {
    width: 100%;
    padding: 0.5rem;
    font-size: 1rem;
    border: 2px solid #ddd;
    border-radius: 4px;
    box-sizing: border-box;
  }

  .taxon-input:focus {
    outline: none;
    border-color: #74ac00;
  }

  .taxon-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    max-height: 300px;
    overflow-y: auto;
    background: white;
    border: 1px solid #ddd;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    z-index: 100;
  }

  .taxon-result {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    cursor: pointer;
    border-bottom: 1px solid #f0f0f0;
  }

  .taxon-result:hover {
    background-color: #f5f5f5;
  }

  .taxon-result-photo {
    width: 40px;
    height: 40px;
    border-radius: 4px;
    object-fit: cover;
  }

  .taxon-result-info {
    flex: 1;
  }

  .taxon-result-name {
    font-weight: 500;
  }

  .submit-id-btn {
    padding: 0.5rem 1rem;
    font-size: 1rem;
    font-weight: 600;
    color: white;
    background-color: #74ac00;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    width: 100%;
  }

  .submit-id-btn:hover:not(:disabled) {
    background-color: #5d8800;
  }

  .submit-id-btn:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }

  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
  }

  .modal-content {
    background: white;
    border-radius: 8px;
    max-width: 90%;
    max-height: 90vh;
    overflow: auto;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid #ddd;
  }

  .modal-header h2 {
    margin: 0;
    font-size: 1.5rem;
  }

  .modal-close {
    background: none;
    border: none;
    font-size: 2rem;
    line-height: 1;
    cursor: pointer;
    color: #999;
    padding: 0;
    width: auto;
  }

  .modal-close:hover {
    color: #c00;
    background: none;
  }

  .modal-body {
    padding: 1.5rem;
    overflow-x: auto;
  }

  .algorithm-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9rem;
  }

  .algorithm-table th,
  .algorithm-table td {
    padding: 0.5rem;
    text-align: left;
    border: 1px solid #ddd;
  }

  .algorithm-table th {
    background-color: #f5f5f5;
    font-weight: 600;
  }

  .algorithm-table tbody tr:hover {
    background-color: #f9f9f9;
  }

  .algorithm-table tbody tr.community-taxon-row {
    background-color: #d4edda;
    font-weight: 600;
  }

  .algorithm-table tbody tr.community-taxon-row:hover {
    background-color: #c3e6cb;
  }

  .disagreement-modal .modal-content {
    max-width: 600px;
  }

  .disagreement-question {
    font-size: 1.1rem;
    font-weight: 500;
    margin-bottom: 1.5rem;
    color: #333;
  }

  .disagreement-options {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .disagreement-btn {
    padding: 1rem;
    font-size: 1rem;
    text-align: left;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
    width: 100%;
    font-weight: 500;
  }

  .disagreement-btn.btn-yes {
    background-color: #74ac00;
  }

  .disagreement-btn.btn-yes:hover {
    background-color: #5d8800;
  }

  .disagreement-btn.btn-no {
    background-color: #ff9800;
  }

  .disagreement-btn.btn-no:hover {
    background-color: #f57c00;
  }

  .needs-id-votes-section {
    margin-top: 1.5rem;
    padding: 1rem;
    background-color: #f0f8ff;
    border-radius: 4px;
    border: 1px solid #b3d9ff;
    transition: all 0.3s;
  }

  .needs-id-votes-section.disabled {
    background-color: #f5f5f5;
    border-color: #ddd;
    opacity: 0.6;
  }

  .needs-id-votes-section.disabled .needs-id-votes-label,
  .needs-id-votes-section.disabled .vote-label {
    color: #999;
  }

  .needs-id-votes-label {
    font-size: 0.95rem;
    color: #333;
    margin-bottom: 0.75rem;
    font-weight: 500;
  }

  .needs-id-votes-row {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .vote-option {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .vote-checkmark {
    background: none;
    border: 2px solid #74ac00;
    color: #74ac00;
    font-size: 1.2rem;
    font-weight: bold;
    border-radius: 4px;
    cursor: pointer;
    padding: 0.25rem 0.5rem;
    width: auto;
    transition: all 0.2s;
  }

  .vote-checkmark:hover:not(:disabled) {
    background-color: #74ac00;
    color: white;
  }

  .vote-checkmark:disabled {
    border-color: #ccc;
    color: #ccc;
    cursor: not-allowed;
  }

  .vote-label {
    font-size: 0.95rem;
    color: #555;
  }

  .vote-count {
    background: none;
    border: none;
    color: #74ac00;
    text-decoration: underline;
    cursor: pointer;
    font-size: 0.9rem;
    padding: 0;
    width: auto;
    font-weight: 600;
  }

  .vote-count:hover {
    color: #5d8800;
    background: none;
  }

  .vote-count-zero {
    font-size: 0.9rem;
    color: #999;
  }

  .votes-modal .modal-content {
    max-width: 500px;
  }

  .voters-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .voter-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    margin-bottom: 0.5rem;
    background-color: #f9f9f9;
    border-radius: 4px;
    border: 1px solid #e0e0e0;
    position: relative;
  }

  .voter-icon {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    object-fit: cover;
  }

  .voter-icon-placeholder {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background-color: #74ac00;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
  }

  .voter-login {
    font-weight: 500;
    color: #333;
  }

  .remove-vote-btn {
    position: absolute;
    top: 0.25rem;
    right: 0.25rem;
    background: none;
    border: none;
    font-size: 1.5rem;
    line-height: 1;
    color: #999;
    cursor: pointer;
    padding: 0.25rem 0.5rem;
    width: auto;
  }

  .remove-vote-btn:hover {
    color: #c00;
    background-color: transparent;
  }

  .voter-icon-placeholder.smiley {
    font-size: 20px;
    line-height: 32px;
  }

  .header-controls {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .tutorial-btn {
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
    font-weight: 600;
    color: white;
    background-color: #2196f3;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.3s;
    width: auto;
    white-space: nowrap;
  }

  .tutorial-btn:hover {
    background-color: #1976d2;
  }

  .survey-btn {
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
    font-weight: 600;
    color: white;
    background-color: #74ac00;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.3s;
    width: auto;
    white-space: nowrap;
  }

  .survey-btn:hover {
    background-color: #5d8800;
  }

  .survey-modal {
    max-width: 1000px;
    width: 95%;
    max-height: 90vh;
  }

  .survey-body {
    min-height: 700px;
    max-height: calc(90vh - 100px);
    padding: 0;
    overflow: auto;
  }

  .survey-body > div {
    width: 100%;
    height: 100%;
    min-height: 700px;
  }

  .survey-body :global(.tf-v1-widget) {
    width: 100% !important;
    height: 700px !important;
  }

  .survey-body :global(iframe) {
    width: 100% !important;
    height: 700px !important;
  }

  .tutorial-modal {
    max-width: 800px;
    width: 90%;
  }

  .tutorial-body {
    max-height: calc(90vh - 120px);
    overflow-y: auto;
    text-align: left;
  }

  .tutorial-body h3 {
    color: #555;
    font-size: 1.2rem;
    margin-top: 1.5rem;
    margin-bottom: 0.75rem;
  }

  .tutorial-body h3:first-child {
    margin-top: 0;
  }

  .tutorial-body ol, .tutorial-body ul {
    margin-bottom: 1rem;
    line-height: 1.6;
  }

  .tutorial-body li {
    margin-bottom: 0.75rem;
  }

  .tutorial-body code {
    background-color: #f5f5f5;
    padding: 0.2rem 0.4rem;
    border-radius: 3px;
    font-family: monospace;
    font-size: 0.9em;
  }

  .tutorial-body a {
    color: #74ac00;
    text-decoration: none;
  }

  .tutorial-body a:hover {
    text-decoration: underline;
  }

  .tutorial-body ul {
    list-style-type: disc;
    padding-left: 1.5rem;
  }

  .tutorial-body ol {
    padding-left: 1.5rem;
  }

  .tutorial-body ul ul {
    margin-top: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .bottom-form {
    margin-top: 2rem;
    padding-top: 2rem;
    border-top: 2px solid #ddd;
  }

  .demo-footer {
    margin-top: 3rem;
    padding-top: 2rem;
    border-top: 1px solid #ddd;
    text-align: center;
    color: #666;
    font-size: 0.9rem;
  }

  .demo-footer p {
    margin: 0.5rem 0;
    line-height: 1.6;
  }

  .demo-footer a {
    color: #74ac00;
    text-decoration: none;
  }

  .demo-footer a:hover {
    text-decoration: underline;
  }

  .footer-links {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .footer-links .separator {
    color: #999;
  }
</style>
