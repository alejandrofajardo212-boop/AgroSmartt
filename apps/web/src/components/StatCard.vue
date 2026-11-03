<script setup>
defineProps({
  label: { type: String, required: true },
  value: { type: [String, Number], required: true },
  unit: { type: String, default: '' },
  change: { type: String, default: '' },
  icon: { type: String, required: true },
  tone: { type: String, default: 'green' }
});
</script>

<template>
  <q-card flat bordered class="stat-card" :class="`stat-card--${tone}`">
    <div class="stat-card__top">
      <span>{{ label }}</span>
      <div class="stat-card__icon" :class="`tone-${tone}`"><q-icon :name="icon" /></div>
    </div>
    <div class="stat-card__value">{{ value }}<small>{{ unit }}</small></div>
    <div class="stat-card__change">{{ change }}</div>
  </q-card>
</template>
