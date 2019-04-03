<template>
  <div>
    <div class="panel panel-default">
      <div class="panel-heading">
        <h3 class="panel-title" v-lang="'help_1_title'">
          <!--Überblick-->
        </h3>
      </div>
      <div class="panel-body" v-lang="'help_1_description'"></div>
    </div>
    <div class="panel panel-default">
      <div class="panel-heading">
        <h3 class="panel-title" v-lang="'help_2_title'">
          <!--Überblick-->
        </h3>
      </div>
      <div class="panel-body" v-lang="'help_2_description'"></div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";

/**
 * legt den Component Namen fest, damit dieser als HTML Tag
 * genutzt werden kann ->
 *
 * const componentName = "help-component";
 * --->
 * <html>... <help-component> ... </html>
 */
const componentName = "help-component";
export default Vue.component(componentName, {});
</script>

<style>
</style>