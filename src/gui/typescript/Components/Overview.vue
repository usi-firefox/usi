<template>
    <div id="usi-overview">
        <div class="panel panel-default">
            <div class="panel-heading">
                <h3 class="panel-title" data-usi-lang="overview">
                    <!--Überblick-->
                </h3>
            </div>
            <div class="panel-body" data-usi-lang="overview_description">
                <!-- 		Die Optionen sind nun unterteilt in mehrere Bereiche,
            falls du deine geladenen Userscripte einsehen möchtest gehe auf den Bereich "Alle Userscripts" -->
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import Vue from "vue";

/**
 * legt den Component Namen fest, damit dieser als HTML Tag
 * genutzt werden kann ->
 *
 * const componentName = "overview-component";
 * --->
 * <html>... <overview-component> ... </html>
 */
const componentName = "overview-component";
export default Vue.component(componentName, {});
</script>

<style>

</style>