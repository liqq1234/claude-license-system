<template>
    <div id="app" :class="appLayoutClass">
        <router-view />
    </div>
</template>

<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();

// 根据路由动态设置布局class
const appLayoutClass = computed(() => {
    if (
        route.path === "/login" ||
        route.path === "/register" ||
        route.path === "/"
    ) {
        return "login-layout";
    } else {
        return "dashboard-layout";
    }
});
</script>

<style>
/* App样式已移至全局样式文件 */
</style>
