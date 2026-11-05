package com.noop.ui

import org.junit.Assert.assertEquals
import org.junit.Test

class AppearanceModeTest {

    @Test
    fun newInstallsDefaultToLightAndStoredPreferencesArePreserved() {
        assertEquals(AppearanceMode.LIGHT, AppearanceMode.fromStorage(null))
        assertEquals(AppearanceMode.LIGHT, AppearanceMode.fromStorage("unknown"))
        for (mode in AppearanceMode.entries) {
            assertEquals(mode, AppearanceMode.fromStorage(mode.storageValue))
        }
    }
}
